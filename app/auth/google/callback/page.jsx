"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../lib/context";
import toast, { Toaster } from "react-hot-toast";

export default function GoogleCallback() {
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
                // پیام رو به صفحه بعدی پاس بده
                sessionStorage.setItem("welcomeMessage", data.user.name);
                router.push(data.user.role === "admin" ? "/admin" : "/profile");
            } catch (err) {
                toast.error(err.message || "خطا در ورود با گوگل");
                router.push("/auth");
            }
        };

        exchange();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen fixed inset-0">
            <Toaster position="top-center" />
            <div className="text-center">
                {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div> */}
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <svg width="80" height="80" viewBox="0 0 48 48"
                        className="animate-spin object-contain">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
                        در حال ورود با گوگل...
                    </p>
                </div>
            </div>
        </div>
    );
}