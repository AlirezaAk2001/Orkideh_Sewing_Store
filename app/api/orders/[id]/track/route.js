import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch {
    return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
  }

  const { paymentTrackId } = await req.json();
  const orderId = parseInt(params.id);

  await prisma.order.update({
    where: { id: orderId, userId },
    data: { paymentTrackId },
  });

  return NextResponse.json({ success: true });
}