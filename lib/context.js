"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

useEffect(() => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  
  if (storedUser) {
    setCurrentUser(JSON.parse(storedUser));
  }

  const fetchUserData = async () => {
    if (token) {
      try {
        const [userRes, addressesRes] = await Promise.all([
          fetch("/api/user", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json()),
          fetch("/api/user/addresses", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json()),
        ]);

        if (userRes.error && userRes.error.includes("توکن نامعتبر")) {
          // ❌ ریدایرکت نکن، فقط وضعیت رو ریست کن
          setCurrentUser(null);
          setAddresses([]);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          console.log("توکن نامعتبر، کاربر خارج شد (بدون ریدایرکت)");
        } else if (userRes.user) {
          setCurrentUser(userRes.user);
          localStorage.setItem("user", JSON.stringify(userRes.user));
        }

        if (addressesRes.addresses) {
          setAddresses(addressesRes.addresses);
        }
      } catch (err) {
        console.error("⚠️ خطا در بارگذاری اطلاعات کاربر:", err);
        setCurrentUser(null);
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentUser(null);
      setAddresses([]);
      setLoading(false);
    }
  };

  fetchUserData();
}, []);

  const login = async (user, token) => {
    setCurrentUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setError(null);

    try {
      const res = await fetch("/api/user/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.addresses) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("خطا در دریافت آدرس‌ها.");
    }

    // اطلاع‌رسانی برای بارگیری مجدد سبد و علاقه‌مندی
    window.dispatchEvent(new Event("auth:login"));
  };

  const logout = (redirectTo = "/auth") => {
    setCurrentUser(null);
    setAddresses([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cartItems");
    localStorage.removeItem("favorites");
    setError(null);

    window.dispatchEvent(new Event("auth:logout"));
    router.push(redirectTo);
  };

  const updateUser = async ({ username }) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("لطفاً دوباره وارد شوید.");

    const res = await fetch("/api/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در به‌روزرسانی اطلاعات کاربر");

    setCurrentUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  };

  const addAddress = async ({ address, postalCode }) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("لطفاً دوباره وارد شوید.");

    const res = await fetch("/api/user/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ address, postalCode }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در افزودن آدرس");

    setAddresses((prev) => [...prev, data.address]);
    return data.address;
  };

  const updateAddress = async ({ id, address, postalCode }) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("لطفاً دوباره وارد شوید.");

    const res = await fetch("/api/user/addresses", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, address, postalCode }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در به‌روزرسانی آدرس");

    setAddresses((prev) =>
      prev.map((addr) => (addr.id === data.address.id ? data.address : addr))
    );
    return data.address;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        addresses,
        loading,
        error,
        login,
        logout,
        updateUser,
        addAddress,
        updateAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// ------------------ Favorites Context ------------------
const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // بارگذاری علاقه‌مندی‌ها
  useEffect(() => {
    const loadFavorites = async () => {
      if (currentUser) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const res = await fetch("/api/favorites", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              // ساختار پاسخ API: { favorites: [{id, name, price, image}] }
              setFavorites(data.favorites || []);
            } else {
              setFavorites([]);
            }
          } catch (err) {
            console.error("Error loading favorites:", err);
            setFavorites([]);
          }
        }
      } else {
        // مهمان: از localStorage بخون
        const saved = localStorage.getItem("favorites");
        setFavorites(saved ? JSON.parse(saved) : []);
      }
      setInitialized(true);
    };

    loadFavorites();
  }, [currentUser]);

  // ذخیره در localStorage فقط برای مهمان
  useEffect(() => {
    if (!currentUser && initialized) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, currentUser, initialized]);

  // پاک کردن هنگام logout
  useEffect(() => {
    const handleLogout = () => {
      setFavorites([]);
      localStorage.removeItem("favorites");
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // افزودن محصول
  const addToFavorites = async (item) => {
    // optimistic update
    setFavorites((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [...prev, { id: item.id, name: item.name, price: item.price, image: item.image }];
    });

    if (currentUser) {
      const token = localStorage.getItem("token");
      try {
        await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: item.id }),
        });
      } catch (err) {
        console.error("Error adding favorite:", err);
        // rollback در صورت خطا
        setFavorites((prev) => prev.filter((p) => p.id !== item.id));
      }
    }
  };

  // حذف محصول
  const removeFromFavorites = async (id) => {
    // optimistic update
    setFavorites((prev) => prev.filter((p) => p.id !== id));

    if (currentUser) {
      const token = localStorage.getItem("token");
      try {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: id }),
        });
      } catch (err) {
        console.error("Error removing favorite:", err);
      }
    }
  };

  const favoritesCount = favorites.length;

  return (
    <FavoritesContext.Provider
      value={{ favorites, addToFavorites, removeFromFavorites, favoritesCount }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
};

// ------------------ Cart Context ------------------
const CartContext = createContext();

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // بارگذاری سبد خرید
  useEffect(() => {
    const loadCart = async () => {
      if (currentUser) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const res = await fetch("/api/cart", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              const parsed = data.map((item) => ({
                id: item.productId,
                name: item.Product.name,
                price: item.Product.finalPrice || item.Product.price,
                image: item.Product.image,
                quantity: item.quantity,
                slug: item.Product.slug,
              }));
              setCartItems(parsed);
              localStorage.setItem("cartItems", JSON.stringify(parsed));
            } else {
              setCartItems([]);
              localStorage.removeItem("cartItems");
            }
          } catch (err) {
            console.error("Error loading cart:", err);
            setCartItems([]);
          }
        }
      } else {
        const saved = localStorage.getItem("cartItems");
        setCartItems(saved ? JSON.parse(saved) : []);
      }
      setInitialized(true);
    };

    loadCart();
  }, [currentUser]);

  // همگام‌سازی با localStorage (فقط برای مهمان)
  useEffect(() => {
    if (!currentUser && initialized) {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
  }, [cartItems, currentUser, initialized]);

  // پاک کردن در زمان خروج
  useEffect(() => {
    const handleLogout = () => {
      setCartItems([]);
      localStorage.removeItem("cartItems");
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const addToCart = async (product) => {
    const productData = {
      id: product.id,
      name: product.name,
      price: product.finalPrice || product.price,
      image: product.image,
      quantity: product.quantity || 1,
    };

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + (product.quantity || 1) }
            : i
        );
      }
      return [...prev, productData];
    });

    if (!currentUser) {
      Swal.fire({
        icon: "warning",
        title: "نیاز به ورود",
        text: "برای ذخیره سبد خرید در سرور، لطفاً وارد شوید.",
        confirmButtonText: "ورود",
        showCancelButton: true,
        cancelButtonText: "ادامه بدون ورود",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/auth?redirect=" + encodeURIComponent(window.location.pathname);
        }
      });
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: product.quantity || 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        Swal.fire("خطا", data.error || "خطا در افزودن به سبد خرید", "error");
      }
    } catch (err) {
      Swal.fire("خطا", "خطا در ارتباط با سرور", "error");
    }
  };

  const removeFromCart = async (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));

    if (!currentUser) return;

    const token = localStorage.getItem("token");
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id }),
      });
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem("cartItems");

    if (!currentUser) return;

    const token = localStorage.getItem("token");
    try {
      await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, cartCount, initialized }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};