"use client";

import { Tooltip } from "@mui/material";

// راهنمای کوچک بالای دکمه‌های آیکونی: همان Tooltip مواد (در portal باز می‌شود و جدول با overflow آن را نمی‌بُرد) با ظاهر تیرهٔ پنل
const TIP_STYLE = {
  tooltip: {
    sx: {
      bgcolor: "#1f2937",
      color: "#fff",
      fontFamily: "Vazirmatn, sans-serif",
      fontSize: "0.75rem",
      fontWeight: 500,
      borderRadius: "8px",
      px: 1.25,
      py: 0.75,
    },
  },
  arrow: { sx: { color: "#1f2937" } },
};

export default function Tip({ title, children }) {
  return (
    <Tooltip title={title} placement="top" arrow enterDelay={250} slotProps={TIP_STYLE}>
      {children}
    </Tooltip>
  );
}
