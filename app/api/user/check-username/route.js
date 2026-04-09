import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    return NextResponse.json({ exists: !!user });
  } catch (err) {
    console.error("Check username error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}