import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, useSubmit, useNavigation, useRouteError, Link } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, BlockStack, InlineStack, TextField, Box, Divider, Icon } from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import { getStoreSettings, updateStoreSettings } from "../models/settings.server";
import { TEMPLATES } from "../lib/templates";
import { useState, useEffect } from "react";

export const loader = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const templateId = params.id;

  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    return redirect("/app/templates");
  }

  const { billing: shopifyBilling } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await shopifyBilling.check({
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

  const canUseTemplate = (tier) => {
    if (tier === "free") return true;
    if (tier === "starter" && (activePlan === "Starter" || activePlan === "Pro")) return true;
    if (tier === "pro" && activePlan === "Pro") return true;
    return false;
  };

  const isUnlocked = canUseTemplate(template.tier);

  const settings = await getStoreSettings(shop);
  
  let savedSettings = {};
  try {
    const saved = JSON.parse(settings.templateSettings || "{}");
    // If the currently active template matches this one, load its settings
    if (settings.activeTemplate === template.id && Object.keys(saved).length > 0) {
      savedSettings = saved;
    } else {
      savedSettings = template.defaultSettings;
    }
  } catch {
    savedSettings = template.defaultSettings;
  }

  return json({ template, savedSettings, isCurrentlyActive: settings.activeTemplate === template.id, isUnlocked });
};

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const templateId = params.id;
  
  const formData = await request.formData();
  const templateSettings = formData.get("templateSettings");

  await updateStoreSettings(shop, { 
    activeTemplate: templateId,
    templateSettings 
  });

  return json({ success: true });
};

export default function TemplateEditor() {
  const { template, savedSettings, isCurrentlyActive, isUnlocked } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const isSubmitting = navigation.state === "submitting" || fetcher.state !== "idle";

  const [draftSettings, setDraftSettings] = useState(savedSettings);

  const handleSave = () => {
    if (!isUnlocked) {
      navigate("/app/billing");
      return;
    }
    const formData = new FormData();
    formData.append("templateSettings", JSON.stringify(draftSettings));
    submit(formData, { method: "post" });
    shopify.toast.show("Template saved and applied to your store!");
  };

  return (
    <Page fullWidth>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="400">
            <Button icon={ArrowLeftIcon} onClick={() => navigate("/app/templates")} variant="plain" disabled={isNavigating || isSubmitting} />
            <Text variant="headingLg" as="h1">Customize: {template.name}</Text>
          </InlineStack>
          <Button 
            variant={isUnlocked ? "primary" : "secondary"} 
            onClick={handleSave}
            loading={isNavigating && navigation.location?.pathname === "/app/billing"}
            disabled={isSubmitting || isNavigating}
          >
            {isUnlocked ? "Apply to Store" : "Upgrade to Apply"}
          </Button>
        </InlineStack>
        
        <Divider />

        <div style={{ display: 'flex', gap: '24px', minHeight: 'calc(100vh - 160px)' }}>
          {/* Settings Panel */}
          <div style={{ width: '350px', flexShrink: 0 }}>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Design Settings</Text>
                
                <TextField
                  label="Primary Color"
                  value={draftSettings.primaryColor || ""}
                  onChange={(v) => setDraftSettings(s => ({ ...s, primaryColor: v }))}
                  autoComplete="off"
                  helpText="Use hex codes (e.g. #000000)"
                />
                <TextField
                  label="Background Color"
                  value={draftSettings.backgroundColor || ""}
                  onChange={(v) => setDraftSettings(s => ({ ...s, backgroundColor: v }))}
                  autoComplete="off"
                />
                <TextField
                  label="Text Color"
                  value={draftSettings.textColor || ""}
                  onChange={(v) => setDraftSettings(s => ({ ...s, textColor: v }))}
                  autoComplete="off"
                />
                <TextField
                  label="Border Radius"
                  value={draftSettings.borderRadius || ""}
                  onChange={(v) => setDraftSettings(s => ({ ...s, borderRadius: v }))}
                  autoComplete="off"
                  helpText="e.g. 4px, 8px, 12px"
                />
              </BlockStack>
            </Card>
          </div>

          {/* Live Preview Panel */}
          <div style={{ flex: 1, backgroundColor: '#f4f6f8', borderRadius: '8px', padding: '40px', border: '1px solid #e1e3e5', overflowY: 'auto' }}>
            <Card>
               <BlockStack gap="400" align="center">
                 <Text variant="headingMd" as="h3">Live Preview</Text>
                 <Text variant="bodySm" tone="subdued">This is how your FAQs will appear on your storefront.</Text>
                 <Divider />
                 
                 <div style={{ 
                    marginTop: '20px',
                    backgroundColor: draftSettings.backgroundColor || '#fff',
                    color: draftSettings.textColor || '#000',
                    padding: '30px',
                    borderRadius: draftSettings.borderRadius || '0px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease'
                  }}>
                    <h2 style={{ color: draftSettings.primaryColor || '#000', marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>Frequently Asked Questions</h2>
                    
                    <div style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                      <strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>How long does shipping take?</strong>
                      <p style={{ margin: 0, opacity: 0.8, lineHeight: '1.5' }}>Most orders are processed within 24 hours. Domestic shipping usually takes 3-5 business days. International shipping can take 7-14 business days depending on the destination.</p>
                    </div>
                    
                    <div style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                      <strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>What is your return policy?</strong>
                      <p style={{ margin: 0, opacity: 0.8, lineHeight: '1.5' }}>We offer a 30-day money-back guarantee. If you are not completely satisfied with your purchase, you can return it within 30 days for a full refund or exchange.</p>
                    </div>

                    <div style={{ padding: '20px 0' }}>
                      <strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>Do you offer international shipping?</strong>
                      <p style={{ margin: 0, opacity: 0.8, lineHeight: '1.5' }}>Yes, we ship to over 100 countries worldwide. Shipping costs will apply, and will be added at checkout.</p>
                    </div>
                  </div>
               </BlockStack>
            </Card>
          </div>
        </div>
      </BlockStack>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Template Editor Error:", error);
  
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card padding="400">
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2" tone="critical">Failed to load template editor</Text>
              <Text as="p">{error?.message || "An unknown error occurred."}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
