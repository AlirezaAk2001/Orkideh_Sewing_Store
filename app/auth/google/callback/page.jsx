"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../lib/context";
import toast from "react-hot-toast";
import { takeRedirect } from "../../../../lib/redirect";
import PageLoader from "@/app/components/PageLoader";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            toast.error("خطا در ورود با گوگل");
            router.push("/auth");
            return;
        }

        const exchange = async () => {
            try {
                const res = await fetch("/api/auth/google-callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error);

                login(data.user, data.token);
                const target = takeRedirect();
                if (target) {
                    // پیام خوش‌آمد را صفحهٔ پروفایل یا ادمین نشان می‌دهد؛ برای مقصد دیگر همین‌جا نشان می‌دهیم
                    toast.success(`خوش آمدید ${data.user.name} عزیز 🎉`, { position: "top-center" });
                    router.push(target);
                } else {
                    // پیام رو به صفحه بعدی پاس بده
                    sessionStorage.setItem("welcomeMessage", data.user.name);
                    router.push(data.user.role === "admin" ? "/admin" : "/profile");
                }
            } catch (err) {
                toast.error(err.message || "خطا در ورود با گوگل");
                router.push("/auth");
            }
        };

        exchange();
    }, []);

    return <PageLoader className="min-h-screen" label="در حال ورود با گوگل..." />;
}

// useSearchParams باید داخل Suspense باشد، وگرنه build این صفحه شکست می‌خورد
export default function GoogleCallback() {
    return (
        <Suspense fallback={<PageLoader className="min-h-screen" label="در حال ورود با گوگل..." />}>
            <GoogleCallbackContent />
        </Suspense>
    );
}