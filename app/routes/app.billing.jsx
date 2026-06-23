// Vercel deployment trigger comment
import React from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useRouteError } from "@remix-run/react";
import { Page, Layout, Badge } from "@shopify/polaris";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO],
    isTest: true,
  });

  let activePlan = "Free";
  if (hasActivePayment) {
    if (appSubscriptions.some(sub => sub.name === PLAN_PRO)) {
      activePlan = PLAN_PRO;
    } else if (appSubscriptions.some(sub => sub.name === PLAN_STARTER)) {
      activePlan = PLAN_STARTER;
    }
  }

  return json({ activePlan });
};

export const action = async ({ request }) => {
  const { admin, billing, session, redirect: shopifyRedirect } = await authenticate.admin(request);
  const url = new URL(request.url);
  const formData = await request.formData();
  const plan = formData.get("plan");
  
  // Return URL must go through Shopify admin to preserve the embedded app session
  const shopName = session.shop.replace('.myshopify.com', '');
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_API_KEY}/app/approval`;
  
  const isTest = true; 

  try {
    let planName, priceAmount;
    
    if (plan === "starter") {
      planName = PLAN_STARTER;
      priceAmount = 49.0;
    } else if (plan === "pro") {
      planName = PLAN_PRO;
      priceAmount = 99.0;
    } else if (plan === "cancel") {
      // Attempt to cancel all active plans
      const { appSubscriptions } = await billing.check({
        plans: [PLAN_STARTER, PLAN_PRO],
        isTest: true,
      });
      for (const sub of appSubscriptions) {
        await billing.cancel({
          subscriptionId: sub.id,
          isTest: true,
          prorate: true,
        });
      }
      
      // Ensure our database knows the user downgraded
      await db.billingRecord.deleteMany({
        where: { shop: session.shop },
      });

      return shopifyRedirect("/app/billing");
    }

    if (planName) {
      const response = await admin.graphql(
        `#graphql
        mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean!) {
          appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
            userErrors {
              field
              message
            }
            confirmationUrl
          }
        }`,
        {
          variables: {
            name: planName,
            returnUrl,
            test: isTest,
            lineItems: [{
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: priceAmount, currencyCode: "USD" },
                  interval: "EVERY_30_DAYS"
                }
              }
            }]
          },
        }
      );

      const data = await response.json();
      const userErrors = data.data?.appSubscriptionCreate?.userErrors;

      if (userErrors && userErrors.length > 0) {
        throw new Error(`GraphQL User Errors: ${userErrors.map(e => e.message).join(', ')}`);
      }

      const confirmationUrl = data.data?.appSubscriptionCreate?.confirmationUrl;
      if (confirmationUrl) {
        return shopifyRedirect(confirmationUrl, { target: '_parent' });
      }
    }
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Exact billing error:", error);
    throw error;
  }

  return json({ success: true });
};

export default function BillingPage() {
  const { activePlan } = useLoaderData();
  const fetcher = useFetcher();

  const handleUpgrade = (plan) => {
    fetcher.submit({ plan }, { method: "post" });
  };

  const isFree = activePlan === "Free";
  const isStarter = activePlan === "Starter Plan";
  const isPro = activePlan === "Pro Plan";

  return (
    <Page fullWidth>
      <div className="billing-container">
        <style dangerouslySetInnerHTML={{
          __html: `
          .billing-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            text-align: center;
            padding: 40px 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .billing-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .billing-subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 24px;
          }
          .current-plan-badge {
            display: inline-block;
            background: #e9f2ff;
            color: #2c6ecb;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 40px;
          }
          .pricing-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            align-items: stretch;
          }
          .pricing-card {
            background: #fff;
            border: 1px solid #e1e3e5;
            border-radius: 12px;
            padding: 30px;
            text-align: left;
            position: relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .pricing-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 20px rgba(0,0,0,0.08);
          }
          .pricing-card.starter {
            border: 2px solid #5c6ac4;
            background: #fcfdff;
          }
          .pricing-card.pro {
            border: 2px solid #202e78;
            background: #111b52;
            color: white;
          }
          .card-header {
            margin-bottom: 20px;
          }
          .plan-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .free-badge { background: #e4f5e1; color: #2e6b27; }
          .starter-badge { background: #e8eaff; color: #5c6ac4; }
          .pro-badge { background: #ffdb58; color: #8a6a00; }
          
          .plan-name {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .plan-price {
            font-size: 40px;
            font-weight: 800;
            display: flex;
            align-items:baseline;
          }
          .plan-price span {
            font-size: 16px;
            font-weight: 400;
            color: #666;
            margin-left: 4px;
          }
          .pricing-card.pro .plan-price span {
            color: #a0aec0;
          }
          .plan-desc {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
            margin-bottom: 24px;
          }
          .pricing-card.pro .plan-desc {
            color: #a0aec0;
          }
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 0 0 30px 0;
            flex-grow: 1;
          }
          .feature-list li {
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            font-size: 14px;
          }
          .feature-list li::before {
            content: "✓";
            color: #5c6ac4;
            font-weight: bold;
            margin-right: 10px;
          }
          .pricing-card.free .feature-list li::before { color: #2e6b27; }
          .pricing-card.pro .feature-list li::before { color: #48bb78; }
          
          .action-btn {
            width: 100%;
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: opacity 0.2s;
          }
          .action-btn:hover { opacity: 0.9; }
          .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          
          .btn-outline {
            background: transparent;
            border: 1px solid #d2d5d8;
            color: #202223;
          }
          .btn-primary {
            background: #5c6ac4;
            color: white;
          }
          .btn-pro {
            background: #ffdb58;
            color: #111b52;
          }
          .most-popular {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: #8a2be2;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .active-label {
            margin-top: 14px;
            text-align: center;
            font-size: 14px;
            color: #666;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 6px;
          }
          .pricing-card.pro .active-label { color: #a0aec0; }
        `}} />

        <h1 className="billing-title">Choose Your Plan</h1>
        <p className="billing-subtitle">Scale your FAQ game with premium templates and styling.</p>

        <div className="current-plan-badge">
          ✦ Current plan: {activePlan}
        </div>

        <div className="pricing-grid">
          {/* FREE PLAN */}
          <div className="pricing-card free">
            <div className="card-header">
              <span className="plan-badge free-badge">Free</span>
              <h2 className="plan-name">Starter Spark</h2>
              <div className="plan-price">$0<span>/ month</span></div>
              <p className="plan-desc">Essential social proof for new stores.</p>
            </div>
            <ul className="feature-list">
              <li>1 Standard Template</li>
              <li>Unlimited FAQs</li>
              <li>Basic Customization</li>
            </ul>
            {isFree ? (
              <div className="active-label">✓ Current Plan</div>
            ) : (
              <button
                className="action-btn btn-outline"
                onClick={() => handleUpgrade("cancel")}
                disabled={fetcher.state !== "idle"}
              >
                Downgrade to Free
              </button>
            )}
          </div>

          {/* STARTER PLAN */}
          <div className="pricing-card starter">
            <div className="most-popular">Most Popular</div>
            <div className="card-header">
              <span className="plan-badge starter-badge">Starter</span>
              <h2 className="plan-name">Growth Boost</h2>
              <div className="plan-price">$49<span>/ month</span></div>
              <p className="plan-desc">Boost trust with premium themes.</p>
            </div>
            <ul className="feature-list">
              <li>4 Premium Layouts</li>
              <li>Carousel Support</li>
              <li>Gradient Flow Design</li>
            </ul>
            {isStarter ? (
              <div className="active-label">✓ Current Plan</div>
            ) : (
              <button
                className="action-btn btn-primary"
                onClick={() => handleUpgrade("starter")}
                disabled={fetcher.state !== "idle"}
              >
                {isPro ? "Downgrade to Growth Boost" : "Upgrade to Growth Boost"}
              </button>
            )}
          </div>

          {/* PRO PLAN */}
          <div className="pricing-card pro">
            <div className="card-header">
              <span className="plan-badge pro-badge">Premium</span>
              <h2 className="plan-name">Elite Suite</h2>
              <div className="plan-price">$99<span>/ month</span></div>
              <p className="plan-desc">Unlock the full luxury display suite.</p>
            </div>
            <ul className="feature-list">
              <li>All Premium Templates</li>
              <li>Luxury 3D Transforms</li>
              <li>Editorial Spotlight</li>
            </ul>
            {isPro ? (
              <div className="active-label">✓ Current Plan</div>
            ) : (
              <button
                className="action-btn btn-pro"
                onClick={() => handleUpgrade("pro")}
                disabled={fetcher.state !== "idle"}
              >
                Select Elite Suite
              </button>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const errorMessage = error?.message || "An unexpected error occurred during billing.";

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fdf2f2', borderRadius: '8px', border: '1px solid #fecaca', marginTop: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '16px' }}>Billing Setup Failed</h2>
            <p style={{ color: '#7f1d1d', marginBottom: '24px' }}>{errorMessage}</p>
            <p style={{ color: '#7f1d1d', fontSize: '14px' }}>Please check your Shopify store's billing settings or try again later. If you're on a development store, ensure it has billing enabled.</p>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
