import { json } from "@remix-run/node";
import db from "../db.server";

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

    return json(formattedFaqs, { headers });
  } catch (error) {
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
