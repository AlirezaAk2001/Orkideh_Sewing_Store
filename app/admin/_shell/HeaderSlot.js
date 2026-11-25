import { createContext } from "react";

// جایگاه ثابت سربرگ صفحه‌های پنل (layout.jsx): یک div بالای ناحیهٔ اسکرول‌خور <main> که layout عنصرش را در این context می‌گذارد و PageHeader سربرگ خود را با portal
// داخلش می‌کشد. مقدار: undefined = بیرون از layout پنل، null = layout هست و عنصر جایگاه هنوز ساخته نشده، وگرنه خود عنصر
export const HeaderSlotContext = createContext(undefined);
