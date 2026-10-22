import { NextResponse } from 'next/server'

export function proxy(request) {
  // نکست ۱۶ برای آدرس با درصدکد خراب (مثل /products/100%) به‌جای ۴۰۰ یک ۵۰۰ خام برمی‌گرداند؛ ربات‌ها و اسکنرها این آدرس‌ها را زیاد می‌زنند
  try {
    decodeURIComponent(request.nextUrl.pathname);
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode && !request.nextUrl.pathname.startsWith('/maintenance')) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  return NextResponse.next();
}

export const config = {
  // تغییر در این قسمت: اضافه کردن فرمت‌های عکس به Regex برای نادیده گرفته شدن توسط میدل‌ویر
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|maintenance|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}