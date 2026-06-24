import { authenticate } from "../shopify.server";
import db from "../db.server";
import crypto from "crypto";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Clone the request because reading the body consumes the stream
  const clonedRequest = request.clone();
  const rawBody = await clonedRequest.text();
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");

  if (!hmacHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify HMAC signature
  const generatedHash = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");

  let hashEquals = false;
  try {
    hashEquals = crypto.timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(hmacHeader)
    );
  } catch (e) {
    hashEquals = false;
  }

  if (!hashEquals) {
    return new Response("Unauthorized", { status: 401 });
  }

  const topic = request.headers.get("X-Shopify-Topic");
  const shop = request.headers.get("X-Shopify-Shop-Domain");

  // Handle GDPR compliance webhooks
  if (
    topic === "customers/data_request" ||
    topic === "customers/redact" ||
    topic === "shop/redact"
  ) {
    console.log(`GDPR webhook received: ${topic} for ${shop}`);
    try {
      const payload = JSON.parse(rawBody);
      console.log("Payload:", payload);
    } catch (e) {
      console.error("Failed to parse webhook payload safely", e);
    }
    // Return 200 OK immediately for compliance topics
    return new Response("OK", { status: 200 });
  }

  // For other registered webhooks (e.g., APP_UNINSTALLED), use the standard handler
  // Note: authenticate.webhook will also verify the HMAC internally.
  const { topic: authTopic, session, admin, payload } = await authenticate.webhook(request);

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    console.log(`Webhook triggered without admin context for shop ${shop}`);
  }

  switch (authTopic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      await db.fAQ.deleteMany({ where: { shop } });
      await db.category.deleteMany({ where: { shop } });
      await db.analytics.deleteMany({ where: { shop } });
      await db.billingRecord.deleteMany({ where: { shop } });
      console.log(`App uninstalled by ${shop}. All data deleted.`);
      break;
    
    case "APP_SUBSCRIPTIONS_UPDATE":
      // Example placeholder to handle billing status updates
      console.log(`Subscription updated for ${shop}`, payload);
      // Logic to downgrade plan in DB if cancelled, etc.
      break;

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  return new Response("OK", { status: 200 });
};
