"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Icon from "@mdi/react";
import { mdiHeartMinusOutline, mdiCloseCircleOutline, mdiDeleteCircleOutline } from "@mdi/js";

// پنجرهٔ «حذف از علاقه‌مندی‌ها»: همان ظاهر و متن پنجرهٔ صفحهٔ جزئیات محصول (نوار قرمز، «لغو» و «بله، حذف کن»).
// MUI Dialog سنگین است؛ FavoriteButton آن را با next/dynamic و فقط بعد از اولین نیاز بار می‌کند، پس کارت‌های فهرست سبک می‌مانند
export default function FavoriteRemoveDialog({ open, name, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} dir="rtl" PaperProps={{ sx: { borderRadius: "12px" } }}>
      <DialogTitle
        sx={{
          fontFamily: "Vazirmatn, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#ef4444",
          color: "#ffffff",
          borderBottom: "3px solid",
          borderColor: "#b91c1c",
          px: 3,
          py: 1.5,
        }}
      >
        <Icon path={mdiHeartMinusOutline} size={1} color="#ffffff" />
        حذف از علاقه‌مندی‌ها
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
          {`آیا مطمئن هستید؟ محصول "${name}" از علاقه‌مندی‌های شما حذف خواهد شد.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
          <Icon path={mdiCloseCircleOutline} size={1} />
          لغو
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
          <Icon path={mdiDeleteCircleOutline} size={1} />
          بله، حذف کن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
