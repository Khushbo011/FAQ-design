import { json } from "@remix-run/node";
import db from "../db.server";
import { TEMPLATES } from "../lib/templates";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const category = url.searchParams.get("category") || "all";

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const where = { shop, isActive: true };
  if (category !== "all") {
    where.categoryId = category;
  }

  try {
    const faqs = await db.fAQ.findMany({
      where,
      include: { category: true },
      orderBy: { position: "asc" },
    });

    const settings = await db.storeSettings.findUnique({
      where: { shop },
    }) || { activeTemplate: "classic", templateSettings: "{}" };

    const billingRecord = await db.billingRecord.findUnique({
      where: { shop },
    });
    const activePlan = billingRecord ? billingRecord.plan : "Free";

    const formattedFaqs = faqs.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      categoryName: faq.category ? faq.category.name : null,
      position: faq.position,
    }));

    // Add CORS headers for the widget
    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });

    let parsedSettings = JSON.parse(settings.templateSettings || "{}");
    if (!parsedSettings.classic && !parsedSettings.grid && !parsedSettings.split && !parsedSettings.card && !parsedSettings.masonry && !parsedSettings.dark && Object.keys(parsedSettings).length > 0) {
      parsedSettings = { [settings.activeTemplate]: parsedSettings };
    }

    return json({
      faqs: formattedFaqs,
      activePlan,
      activeTemplate: settings.activeTemplate,
      templateSettings: parsedSettings,
      allTemplates: TEMPLATES
    }, { headers });
  } catch (error) {
    console.error("Public FAQs loader error:", error);
    return json({ error: "Server error" }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
};
