import db from "../db.server";

export async function recordAnalyticsEvent(data) {
  return db.analytics.create({
    data: {
      shop: data.shop,
      faqId: data.faqId,
      event: data.event,
      page: data.page,
    },
  });
}

export async function getAnalytics(shop, days = 7) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  return db.analytics.findMany({
    where: {
      shop,
      createdAt: {
        gte: dateLimit,
      },
    },
    include: { faq: true },
    orderBy: { createdAt: "desc" },
  });
}
