"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppImage from "./AppImage";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim() === "") {
        setResults([]);
        return;
      }

      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data))
        .catch(() => setResults([]));
    }, 400); // debounce 0.4s

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (slug) => {
    setQuery("");
    setResults([]);
    router.push(`/products/${slug}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="جستجو در فروشگاه..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-full border border-gray-300 px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-pink-400"
      />

      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-md mt-2">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item.slug)}
              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {item.image && (
                  <AppImage
                    src={item.image}
                    alt={item.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <span>{item.name}</span>
              </div>
              <span className="text-sm text-gray-600">
                {item.price?.toLocaleString("fa-IR")} تومان
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}