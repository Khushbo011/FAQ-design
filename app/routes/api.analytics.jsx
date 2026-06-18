import { json } from "@remix-run/node";
import { recordAnalyticsEvent } from "../models/analytics.server";

export const action = async ({ request }) => {
  // Handle preflight requests for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.shop || !data.faqId || !data.event) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // In a real production app, we would implement rate limiting here
    
    await recordAnalyticsEvent({
      shop: data.shop,
      faqId: data.faqId,
      event: data.event,
      page: data.page,
    });

    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
    });

    return json({ ok: true }, { headers });
  } catch (error) {
    console.error("Analytics Error:", error);
    return json({ error: "Server error" }, { status: 500 });
  }
};
