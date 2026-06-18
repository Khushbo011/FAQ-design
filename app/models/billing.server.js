import db from "../db.server";

export const PLAN_FEATURES = {
  free: {
    maxFaqs: 10,
    maxCategories: 2,
    richText: false,
    search: false,
    analytics: false,
    analyticsRange: 0,
    export: false,
    allStyles: false,
    customCss: false,
  },
  basic: {
    maxFaqs: 50,
    maxCategories: 10,
    richText: true,
    search: true,
    analytics: true,
    analyticsRange: 7,
    export: "csv",
    allStyles: true,
    customCss: false,
  },
  pro: {
    maxFaqs: Infinity,
    maxCategories: Infinity,
    richText: true,
    search: true,
    analytics: true,
    analyticsRange: 90,
    export: "all",
    allStyles: true,
    customCss: true,
  },
};

export async function getBillingRecord(shop) {
  let record = await db.billingRecord.findUnique({ where: { shop } });
  if (!record) {
    record = await db.billingRecord.create({
      data: { shop, plan: "free" },
    });
  }
  return record;
}

export async function checkPlanAccess(shop, feature) {
  const record = await getBillingRecord(shop);
  const plan = record.plan || "free";
  const features = PLAN_FEATURES[plan];
  
  if (features[feature] === undefined) {
    throw new Error(`Unknown feature: ${feature}`);
  }
  
  return {
    hasAccess: Boolean(features[feature]),
    limit: features[feature],
    plan,
  };
}

export async function updateBillingRecord(shop, data) {
  return db.billingRecord.upsert({
    where: { shop },
    update: data,
    create: { shop, ...data },
  });
}
