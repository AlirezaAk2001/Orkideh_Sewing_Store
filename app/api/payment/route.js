import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req) {
  try {
    const { amount, orderId, callbackUrl } = await req.json();
    if (!amount || amount < 1000) {
      console.error("Invalid amount:", amount);
      return NextResponse.json(
        { error: "مبلغ باید حداقل 1000 ریال باشد" },
        { status: 400 }
      );
    }

    const merchant = process.env.ZIBAL_MERCHANT_ID || "zibal";

    console.log("Payment request:", { amount, orderId, callbackUrl });

    const response = await axios.post("https://gateway.zibal.ir/v1/request", {
      merchant,
      amount,
      orderId,
      callbackUrl,
    });

    console.log("Zibal response:", response.data);

    if (response.data.result !== 100) {
      console.error("Zibal payment request failed:", response.data);
      return NextResponse.json(
        { error: response.data.message || "خطا در درخواست پرداخت", result: response.data.result },
        { status: 400 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Payment error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "خطا در درخواست پرداخت: " + (error.response?.data?.error || error.message) },
      { status: error.response?.status || 500 }
    );
  }
}