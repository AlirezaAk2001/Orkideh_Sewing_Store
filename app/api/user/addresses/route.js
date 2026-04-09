import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده است." }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: "خطا در دریافت آدرس‌ها", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده است." }, { status: 401 });
    }

    const { address, postalCode } = await req.json();
    if (!address || !postalCode) {
      return NextResponse.json({ error: "آدرس و کد پستی الزامی است" }, { status: 400 });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        address,
        postalCode,
      },
    });

    return NextResponse.json({ address: newAddress });
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json({ error: "خطا در افزودن آدرس", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده است." }, { status: 401 });
    }

    const { id, address, postalCode } = await req.json();
    if (!id || !address || !postalCode) {
      return NextResponse.json({ error: "شناسه آدرس، آدرس و کد پستی الزامی است" }, { status: 400 });
    }

    const existingAddress = await prisma.address.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingAddress || existingAddress.userId !== userId) {
      return NextResponse.json({ error: "آدرس یافت نشد یا متعلق به شما نیست" }, { status: 404 });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: parseInt(id) },
      data: {
        address,
        postalCode,
      },
    });

    return NextResponse.json({ address: updatedAddress, message: "آدرس با موفقیت به‌روزرسانی شد" });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "خطا در به‌روزرسانی آدرس", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}