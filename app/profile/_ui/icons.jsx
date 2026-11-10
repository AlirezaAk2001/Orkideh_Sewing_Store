import {
  Briefcase,
  Calendar,
  Check,
  ClipboardCheck,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  Hourglass,
  House,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Minus,
  Package,
  PackageCheck,
  PackageOpen,
  Pencil,
  Plus,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Star,
  Store,
  TrendingDown,
  TrendingUp,
  Trash,
  Truck,
  Undo2,
  User,
  X,
  ArrowLeft,
  LoaderCircle,
  ImageUp,
  Sparkles,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// پستچی در حال تحویل بسته (lucide آیکون پستچی ندارد): آدمِ کلاه‌دار رو به چپ با بسته‌ای مکعبی در دست. رو به چپ است چون جریان مراحل در صفحهٔ راست‌به‌چپ به چپ می‌رود.
// سر و بدن توپُر و بسته خطی کشیده شده تا شکل آدم در ۲۰ تا ۲۵ پیکسل هم فوری خوانده شود (نسخهٔ کاملاً خطی در این اندازه فقط یک لکه بود)؛ اندازه و ضخامت خطش در profile.css (svg.postman) تنظیم می‌شود
function Postman({ className = "" }) {
  return (
    <svg className={`postman ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      <g transform="translate(12 12) scale(1.12) translate(-10.7 -11.3)">
        <circle cx="15" cy="5" r="2.4" fill="currentColor" />
        <path d="M12 4.2c.5-2.2 1.6-3 3-3s2.5.8 3 3" />
        <path d="M12 4.2H9.4" />
        <path d="M13 9.8h4.2a1.2 1.2 0 0 1 1.2 1.2V16h-6.6v-5a1.2 1.2 0 0 1 1.2-1.2Z" fill="currentColor" />
        <path d="M13.6 16v5M17.2 16l.4 5" />
        <path d="M3 10.4 6.4 8.8l3.4 1.6v4.6L6.4 16.6 3 15Z" />
        <path d="M6.4 8.8v7.8" />
        <path d="M3 10.4 6.4 12l3.4-1.6" />
        <path d="M12.4 12 9.8 12.6" />
      </g>
    </svg>
  );
}

// آیکون‌های پنل با همان نام کوتاهی که طرح استفاده می‌کند. ظاهرشان (اندازه، ضخامت خط، گوشه‌ها) از .pf svg.i در profile.css می‌آید
const ICONS = {
  dash: LayoutDashboard,
  bag: ShoppingBag,
  pin: MapPin,
  cart: ShoppingCart,
  heart: Heart,
  sliders: SlidersHorizontal,
  out: LogOut,
  truck: Truck,
  check: Check,
  plus: Plus,
  minus: Minus,
  trash: Trash,
  pencil: Pencil,
  arrowL: ArrowLeft,
  chevD: ChevronDown,
  chevL: ChevronLeft,
  chevR: ChevronRight,
  user: User,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  cal: Calendar,
  pack: Package,
  packcheck: PackageCheck,
  box: PackageOpen,
  undo: Undo2,
  hourglass: Hourglass,
  store: Store,
  trend: TrendingUp,
  trendDown: TrendingDown,
  shield: ShieldCheck,
  phone: Smartphone,
  star: Star,
  repeat: Repeat,
  home: House,
  briefcase: Briefcase,
  x: X,
  loader: LoaderCircle,
  clipboard: ClipboardCheck,
  card: CreditCard,
  postman: Postman,
  imageUp: ImageUp,
  sparkles: Sparkles,
  trash2: Trash2,
  upload: Upload,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
};

export function Ic({ n, className = "" }) {
  const Icon = ICONS[n];
  return <Icon className={`i ${className}`.trim()} aria-hidden="true" />;
}
