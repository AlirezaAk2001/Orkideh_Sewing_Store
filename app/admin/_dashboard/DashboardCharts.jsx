"use client";

import { useState } from "react";
import { ChartLine, ChartPie, PackageMinus, Trophy } from "lucide-react";
import Panel from "./Panel";
import SalesChart, { ViewToggle } from "./SalesChart";
import StatusDonut from "./StatusDonut";
import TopProducts from "./TopProducts";
import LowStock from "./LowStock";
import { fa } from "./format";

// چهار پنل نمودار؛ صفحهٔ داشبورد این فایل را lazy بارگذاری می‌کند تا شاخص‌های بالای صفحه بی‌انتظار نمودارها دیده شوند
export default function DashboardCharts({ data, busy }) {
  const [view, setView] = useState("chart");
  const days = fa(data.days);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          index={4}
          icon={ChartLine}
          title="روند فروش"
          subtitle={`فروش روزانهٔ سفارش‌های پرداخت‌شده در ${days} روز اخیر`}
          actions={<ViewToggle view={view} setView={setView} />}
          busy={busy}
        >
          <SalesChart daily={data.daily} view={view} />
        </Panel>
        <Panel index={5} icon={ChartPie} title="وضعیت سفارش‌ها" subtitle={`سفارش‌های ${days} روز اخیر`} busy={busy}>
          <StatusDonut statuses={data.statuses} />
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel index={6} icon={Trophy} title="پرفروش‌ترین کالاها" subtitle={`بر اساس تعداد فروش در ${days} روز اخیر`} busy={busy}>
          <TopProducts items={data.topProducts} />
        </Panel>
        <Panel index={7} icon={PackageMinus} title="کالاهای رو به اتمام" subtitle={`موجودی ${fa(data.lowStockThreshold)} عدد یا کمتر`} busy={busy}>
          <LowStock items={data.lowStock} threshold={data.lowStockThreshold} />
        </Panel>
      </div>
    </>
  );
}
