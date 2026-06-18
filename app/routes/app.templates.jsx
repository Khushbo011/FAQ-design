import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, BlockStack, InlineStack, Badge, Banner, Box, Divider, Modal, TextField } from "@shopify/polaris";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import { getStoreSettings, updateStoreSettings } from "../models/settings.server";
import { TEMPLATES } from "../lib/templates";
import { useState } from "react";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

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
  } else if (actionType === "updateSettings") {
    const templateSettings = formData.get("templateSettings");
    await updateStoreSettings(shop, { templateSettings });
  }

  return json({ success: true });
};

export default function TemplatesPage() {
  const { activePlan, settings, templates } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [draftSettings, setDraftSettings] = useState({});

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

  const handleUpgrade = (tier) => {
    navigate("/app/billing");
  };

  const handleEditOpen = (template) => {
    setEditTemplate(template);
    // Parse existing settings if they exist and match the template, otherwise use defaults
    try {
      const saved = JSON.parse(settings.templateSettings || "{}");
      if (settings.activeTemplate === template.id && Object.keys(saved).length > 0) {
        setDraftSettings(saved);
      } else {
        setDraftSettings(template.defaultSettings);
      }
    } catch {
      setDraftSettings(template.defaultSettings);
    }
  };

  const handleSaveSettings = () => {
    fetcher.submit(
      { actionType: "updateSettings", templateSettings: JSON.stringify(draftSettings) },
      { method: "post" }
    );
    // Auto-apply if saving
    if (settings.activeTemplate !== editTemplate.id) {
      handleApply(editTemplate.id);
    }
    setEditTemplate(null);
    shopify.toast.show("Design settings saved!");
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
                  opacity: isUnlocked ? 1 : 0.6
                }}>
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
                      <Button variant="plain" onClick={() => setPreviewTemplate(template)}>Live Preview</Button>
                      {isUnlocked && template.tier !== "free" && (
                        <Button variant="plain" tone="critical" onClick={() => handleEditOpen(template)}>Edit Design</Button>
                      )}
                    </InlineStack>

                    {isUnlocked ? (
                      <Button
                        variant={isActive ? "secondary" : "primary"}
                        disabled={isActive}
                        fullWidth
                        onClick={() => handleApply(template.id)}
                      >
                        {isActive ? "✓ Applied" : "Apply Template"}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        tone="success"
                        fullWidth
                        onClick={() => handleUpgrade(template.tier)}
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

      {/* Live Preview Modal */}
      <Modal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={`Preview: ${previewTemplate?.name}`}
        size="large"
        primaryAction={{
          content: "Close Preview",
          onAction: () => setPreviewTemplate(null),
        }}
      >
        <Modal.Section>
          <div style={{ 
            minHeight: '400px', 
            backgroundColor: previewTemplate?.defaultSettings?.backgroundColor || '#fff',
            color: previewTemplate?.defaultSettings?.textColor || '#000',
            padding: '20px',
            borderRadius: previewTemplate?.defaultSettings?.borderRadius || '0px',
            border: '1px solid #ddd'
          }}>
            <h2 style={{ color: previewTemplate?.defaultSettings?.primaryColor || '#000', marginBottom: '20px' }}>Frequently Asked Questions</h2>
            <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <strong>How does the free trial work?</strong>
              <p style={{ marginTop: '10px' }}>This is a preview of how your FAQs will look using the {previewTemplate?.name} template. The actual appearance may vary based on your store's theme CSS.</p>
            </div>
            <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <strong>Can I cancel anytime?</strong>
              <p style={{ marginTop: '10px' }}>Yes, you can cancel your subscription at any time from the billing page.</p>
            </div>
          </div>
        </Modal.Section>
      </Modal>

      {/* Edit Design Modal */}
      <Modal
        open={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        title={`Edit Design: ${editTemplate?.name}`}
        primaryAction={{
          content: "Save Design",
          onAction: handleSaveSettings,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setEditTemplate(null),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" tone="subdued">Customize colors and layout. Note: Hex color codes must include the #.</Text>
            <TextField
              label="Primary Color"
              value={draftSettings.primaryColor || ""}
              onChange={(v) => setDraftSettings(s => ({ ...s, primaryColor: v }))}
              autoComplete="off"
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
        </Modal.Section>
      </Modal>
    </Page>
  );
}
