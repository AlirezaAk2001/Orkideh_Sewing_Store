"use client";

import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import Icon from "@mdi/react";
import { mdiCloseCircleOutline } from "@mdi/js";

// تأییدیهٔ کارهای برگشت‌ناپذیر (حذف سفارش، حذف از سبد و علاقه‌مندی‌ها، خروج) با همان دیالوگ همیشگی سایت: نوار رنگی بالا (قرمز یا آبی)، دکمهٔ لغو و دکمهٔ تأیید.
// کلیک روی پس‌زمینه دیالوگ را نمی‌بندد و فقط آن را می‌لرزاند (dialogShake در globals.css)
const TONES = {
  red: { bar: "#ef4444", edge: "#b91c1c" },
  blue: { bar: "#3b82f6", edge: "#1d4ed8" },
};
const font = { fontFamily: "Vazirmatn, sans-serif" };

export default function ConfirmDialog({ open, onClose, onConfirm, title, icon, tone = "red", confirmLabel, confirmIcon, cancelLabel = "لغو", minWidth, children }) {
  const [shake, setShake] = useState(false);
  const t = TONES[tone] ?? TONES.red;

  const onBackdrop = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <Dialog
      open={open}
      onClose={onBackdrop}
      dir="rtl"
      PaperProps={{ sx: { animation: shake ? "dialogShake 0.5s ease" : "none", borderRadius: "12px", ...(minWidth ? { minWidth } : null) } }}
    >
      <DialogTitle sx={{ ...font, display: "flex", alignItems: "center", gap: 1, backgroundColor: t.bar, color: "#ffffff", borderBottom: "3px solid", borderColor: t.edge, px: 3, py: 1.5 }}>
        <Icon path={icon} size={1} color="#ffffff" />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div" sx={{ ...font, marginTop: "8px" }}>
          {children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={font}>
          <Icon path={mdiCloseCircleOutline} size={1} />
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" sx={font}>
          <Icon path={confirmIcon} size={1} />
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
