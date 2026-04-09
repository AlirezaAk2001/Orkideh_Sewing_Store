"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Icon from '@mdi/react';
import { mdiMonitorDashboard, mdiPanoramaVariantOutline, mdiCommentAccountOutline, mdiAccountFileText } from '@mdi/js';
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { ShoppingBag } from "lucide-react";
import { Box, Skeleton } from "@mui/material";

export default function AdminHome() {
  const [stats, setStats] = useState({
    banners: 0,
    categories: 0,
    products: 0,
    comments: 0,
    orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("لطفاً ابتدا وارد شوید");
          router.push("/admin/login");
          return;
        }

        // ذخیره state loading در localStorage
        localStorage.setItem('adminLoading', 'true');

        const requests = [
          { name: "banners", url: "/api/admin/banners" },
          { name: "categories", url: "/api/admin/categories" },
          { name: "products", url: "/api/admin/products" },
          { name: "comments", url: "/api/admin/comments" },
          { name: "orders", url: "/api/admin/orders" },
        ];

        const responses = await Promise.all(
          requests.map(({ name, url }) =>
            axios
              .get(url, { headers: { Authorization: `Bearer ${token}` } })
              .catch((err) => ({ name, error: err }))
          )
        );

        const newStats = { banners: 0, categories: 0, products: 0, comments: 0, orders: 0 };
        responses.forEach((res, index) => {
          if (res.error) {
            console.error(`Error fetching ${requests[index].name}:`, res.error.response?.data || res.error.message);
            if (res.error.response?.status === 403) {
              throw new Error(`دسترسی غیرمجاز برای ${requests[index].name}`);
            }
          } else {
            newStats[requests[index].name] = res.data.length || res.data.orders?.length || 0;
          }
        });

        setStats(newStats);
      } catch (err) {
        console.error("خطا در دریافت آمار:", err);
        if (err.message.includes("دسترسی غیرمجاز")) {
          toast.error("شما دسترسی ادمین ندارید");
          localStorage.removeItem("token");
          router.push("/admin/login");
        } else if (err.response?.status === 401) {
          toast.error("دسترسی غیرمجاز. لطفاً دوباره وارد شوید");
          localStorage.removeItem("token");
          router.push("/admin/login");
        } else {
          toast.error(err.response?.data?.error || "خطا در دریافت آمار");
        }
      } finally {
        setLoading(false);
        // حذف state loading از localStorage
        localStorage.removeItem('adminLoading');
      }
    };

    fetchStats();

    // تمیزکاری هنگام unmount
    return () => {
      localStorage.removeItem('adminLoading');
    };
  }, [router]);

  const cards = [
    { name: "بنرها", icon: <Icon path={mdiPanoramaVariantOutline} size={1.3} />, value: stats.banners },
    { name: "دسته‌بندی‌ها", icon: <CategoryOutlinedIcon fontSize="large" />, value: stats.categories },
    { name: "محصولات", icon: <ShoppingBag className="w-7 h-7" />, value: stats.products },
    { name: "نظرات کاربران", icon: <Icon path={mdiCommentAccountOutline} size={1.3} />, value: stats.comments },
    { name: "سفارش‌های کاربران", icon: <Icon path={mdiAccountFileText} size={1.3} />, value: stats.orders },
  ];

  // کامپوننت اسکلتون لودر
  const SkeletonLoader = () => (
    <Box sx={{ width: "100%" }}>
      
      {/* کارت‌های اسکلتون */}
      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: { 
          xs: "1fr", 
          sm: "repeat(2, 1fr)", 
          lg: "repeat(5, 1fr)" 
        }, 
        gap: 4 
      }}>
        {Array.from(new Array(5)).map((_, index) => (
          <Box 
            key={index}
            sx={{ 
              bgcolor: 'white', 
              p: 3, 
              borderRadius: 2, 
              boxShadow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              height: 180
            }}
          >
            {/* آیکون اسکلتون */}
            <Skeleton variant="circular" width={48} height={48} />
            
            {/* عنوان اسکلتون */}
            <Skeleton variant="text" width="80%" height={30} />
            
            {/* مقدار اسکلتون */}
            <Skeleton variant="text" width={60} height={40} />
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <div className="p-4" dir="rtl">
      <Toaster position="top-right" />
      
      <h1 className="text-2xl font-bold mb-6 flex gap-1">
        <Icon path={mdiMonitorDashboard} size={1.2} />
         داشبورد مدیریت
      </h1>

      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {cards.map((card) => (
              <div 
                key={card.name} 
                className="bg-white p-4 rounded shadow flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
                style={{ height: '180px' }}
              >
                <div className="text-pink-600">{card.icon}</div>
                <h2 className="font-bold text-center">{card.name}</h2>
                <p className="text-xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}