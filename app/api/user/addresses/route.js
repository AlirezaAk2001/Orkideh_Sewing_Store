import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseAddressInput } from "@/lib/addressInput";
import { withMapUrl } from "@/lib/neshan";

// آدرس‌های کاربر. حذف «نرم» است (deletedAt): سفارش‌های قبلی به ردیف آدرس وصل‌اند و نباید مقصدشان گم شود.
// هر آدرسی که به کلاینت می‌رود، اگر مختصات دارد و سرویس نقشه تنظیم است، mapUrl (تصویر امضاشدهٔ نقشهٔ کارت) هم دارد

export async function GET(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ addresses: addresses.map(withMapUrl) });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: "خطا در دریافت آدرس‌ها", details: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    const parsed = parseAddressInput(await req.json());
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const newAddress = await prisma.address.create({
      data: { userId, ...parsed.data },
    });

    return NextResponse.json({ address: withMapUrl(newAddress) });
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json({ error: "خطا در افزودن آدرس", details: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    const body = await req.json();
    const id = parseInt(body?.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "شناسه آدرس الزامی است" }, { status: 400 });
    }

    const parsed = parseAddressInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const existingAddress = await prisma.address.findUnique({ where: { id } });
    if (!existingAddress || existingAddress.userId !== userId || existingAddress.deletedAt) {
      return NextResponse.json({ error: "آدرس یافت نشد یا متعلق به شما نیست" }, { status: 404 });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ address: withMapUrl(updatedAddress), message: "آدرس با موفقیت به‌روزرسانی شد" });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "خطا در به‌روزرسانی آدرس", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    const id = parseInt(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "شناسه آدرس الزامی است" }, { status: 400 });
    }

    const existingAddress = await prisma.address.findUnique({ where: { id } });
    if (!existingAddress || existingAddress.userId !== userId || existingAddress.deletedAt) {
      return NextResponse.json({ error: "آدرس یافت نشد یا متعلق به شما نیست" }, { status: 404 });
    }

    await prisma.address.update({ where: { id }, data: { deletedAt: new Date() } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "خطا در حذف آدرس", details: error.message }, { status: 500 });
  }
}
