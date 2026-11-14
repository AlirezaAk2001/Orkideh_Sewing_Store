"use client";

import { Tooltip } from "react-tooltip";
import { TIP_ID } from "@/lib/tip";

// تنها Tooltip برنامه برای راهنمای دکمه‌ها (به‌جای title مرورگر)؛ یک بار در layout ریشه. هر عنصر با tip(...) از lib/tip.js به آن وصل می‌شود.
// ظاهر (تیره، گرد، فونت سایت) در globals.css با .app-tip است. با «کاهش حرکت» محو شدن ندارد (همان‌جا)
export default function AppTooltip() {
  return <Tooltip id={TIP_ID} className="app-tip" place="top" delayShow={250} />;
}
