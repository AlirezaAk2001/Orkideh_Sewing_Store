import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim() === "") {
    return NextResponse.json([]);
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        price: true,
        finalPrice: true,
        Category: {
          select: { name: true },
        },
      },
      take: 8,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching search results:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}