import { redirect } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO],
    isTest: true,
  });

  let activePlan = "Free";
  if (hasActivePayment) {
    if (appSubscriptions.some(sub => sub.name === PLAN_PRO)) {
      activePlan = "Pro";
    } else if (appSubscriptions.some(sub => sub.name === PLAN_STARTER)) {
      activePlan = "Starter";
    }
  }

  // Sync with DB to avoid checking on every page load
  await prisma.billingRecord.upsert({
    where: { shop: session.shop },
    update: { plan: activePlan },
    create: { shop: session.shop, plan: activePlan }
  });

  return redirect("/app/templates");
};

export default function ApprovalPage() {
  return null;
}
