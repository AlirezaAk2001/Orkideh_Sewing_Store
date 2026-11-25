import { joinFields } from "@/app/admin/_list/search";

// متن قابل جست‌وجوی یک نظر: نام و نام کاربری، نام محصول، متن نظر و پاسخ مدیر (منطق جست‌وجو مشترک پنل در _list/search.js)
export function haystack(comment) {
  return joinFields([comment.User?.name, comment.User?.username, comment.Product?.name, comment.text, comment.adminReply]);
}
