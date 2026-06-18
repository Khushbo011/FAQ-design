import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    console.log(`Webhook triggered without admin context for shop ${shop}`);
  }

  switch (topic) {
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
    
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      // Handle GDPR requests.
      // In this app, we don't store PII so we can just return 200.
      console.log(`GDPR webhook received: ${topic} for ${shop}`);
      break;
    
    case "APP_SUBSCRIPTIONS_UPDATE":
      // Example placeholder to handle billing status updates
      console.log(`Subscription updated for ${shop}`, payload);
      // Logic to downgrade plan in DB if cancelled, etc.
      break;

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
