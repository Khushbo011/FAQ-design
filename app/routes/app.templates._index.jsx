import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, useNavigation } from "@remix-run/react";
import { Page, Card, Text, Button, BlockStack, InlineStack, Badge, Banner, Box } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getStoreSettings, updateStoreSettings } from "../models/settings.server";
import { TEMPLATES } from "../lib/templates";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  // Check billing via Shopify API for real-time accuracy
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: ["Starter Plan", "Pro Plan"],
    isTest: true,
  });

  let activePlan = "Free";
  if (hasActivePayment) {
    if (appSubscriptions.some(sub => sub.name === "Pro Plan")) {
      activePlan = "Pro";
    } else if (appSubscriptions.some(sub => sub.name === "Starter Plan")) {
      activePlan = "Starter";
    }
  }

  const settings = await getStoreSettings(shop);

  return json({ activePlan, settings, templates: TEMPLATES });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const actionType = formData.get("actionType");

  if (actionType === "applyTemplate") {
    const templateId = formData.get("templateId");
    await updateStoreSettings(shop, { activeTemplate: templateId });
  }

  return json({ success: true });
};

export default function TemplatesPage() {
  const { activePlan, settings, templates } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);
  const isNavigating = navigation.state !== "idle";
  const isFetching = fetcher.state !== "idle";

  // Clear loadingTemplateId when navigation completes
  if (!isNavigating && loadingTemplateId) {
    // Will be reset on next render cycle when navigation finishes
  }

  const canUseTemplate = (tier) => {
    if (tier === "free") return true;
    if (tier === "starter" && (activePlan === "Starter" || activePlan === "Pro")) return true;
    if (tier === "pro" && activePlan === "Pro") return true;
    return false;
  };

  const handleApply = (templateId) => {
    fetcher.submit({ actionType: "applyTemplate", templateId }, { method: "post" });
    shopify.toast.show("Template Applied Successfully");
  };

  const handleUpgrade = (tier, templateId) => {
    setLoadingTemplateId(templateId);
    navigate("/app/billing");
  };

  const handlePreviewCustomize = (template) => {
    setLoadingTemplateId(template.id);
    navigate(`/app/templates/${template.id}`);
  };

  return (
    <Page title="Designs & Templates" subtitle="Elevate your storefront with premium FAQ designs">
      <BlockStack gap="500">
        <Banner
          title="Unlock Premium FAQ Designs"
          tone="info"
        >
          <p>
            Choose the <b>Starter Plan ($49/mo)</b> for Grid, Card, and Split designs, or the <b>Pro Plan ($99/mo)</b> for Dark Mode & Masonry designs.
          </p>
        </Banner>

        <Box paddingBlockEnd="400">
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h2">Current Plan: <Badge tone={activePlan === "Pro" ? "success" : activePlan === "Starter" ? "info" : "new"}>{activePlan}</Badge></Text>
            <Button variant="primary" onClick={() => navigate("/app/billing")}>Manage Plan</Button>
          </InlineStack>
        </Box>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {templates.map((template) => {
            const isUnlocked = canUseTemplate(template.tier);
            const isActive = settings.activeTemplate === template.id;

            return (
              <Card key={template.id} padding="0">
                <div style={{
                  height: '180px',
                  backgroundColor: '#f4f6f8',
                  backgroundImage: `url(${template.previewImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  borderBottom: '1px solid #e1e3e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isUnlocked ? 1 : 0.6,
                  transition: 'opacity 0.2s ease-in-out',
                  cursor: isNavigating && loadingTemplateId === template.id ? 'wait' : 'pointer',
                  pointerEvents: isNavigating && loadingTemplateId === template.id ? 'none' : 'auto'
                }} onClick={() => handlePreviewCustomize(template)}>
                  {!isUnlocked && (
                    <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '12px' }}>
                      Locked
                    </div>
                  )}
                </div>
                
                <Box padding="400">
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h3">{template.name}</Text>
                      <Badge tone={template.tier === "free" ? "success" : template.tier === "starter" ? "info" : "warning"}>
                        {template.tier.toUpperCase()}
                      </Badge>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued">{template.description}</Text>
                    
                    <InlineStack align="center" blockAlign="center" gap="400">
                      <Button variant="plain" loading={isNavigating && loadingTemplateId === template.id && navigation.location?.pathname === `/app/templates/${template.id}`} disabled={isNavigating && loadingTemplateId === template.id} onClick={() => handlePreviewCustomize(template)}>
                        {isUnlocked && template.tier !== "free" ? "Customize & Preview" : "Live Preview"}
                      </Button>
                    </InlineStack>

                    {isUnlocked ? (
                      <Button
                        variant={isActive ? "secondary" : "primary"}
                        disabled={isActive || (isFetching && fetcher.formData?.get("templateId") === template.id)}
                        loading={isFetching && fetcher.formData?.get("templateId") === template.id}
                        fullWidth
                        onClick={() => handleApply(template.id)}
                      >
                        {isActive ? "✓ Applied" : "Apply Template"}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        tone="success"
                        disabled={isNavigating && loadingTemplateId === template.id}
                        loading={isNavigating && navigation.location?.pathname === "/app/billing" && loadingTemplateId === template.id}
                        fullWidth
                        onClick={() => handleUpgrade(template.tier, template.id)}
                      >
                        Upgrade to {template.tier === "starter" ? "Starter" : "Pro"}
                      </Button>
                    )}
                  </BlockStack>
                </Box>
              </Card>
            );
          })}
        </div>
      </BlockStack>
    </Page>
  );
}
