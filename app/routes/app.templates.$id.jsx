import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
  useSubmit,
  useNavigation,
  useRouteError,
  useBeforeUnload,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  TextField,
  Box,
  Divider,
  Icon,
  Select,
  RangeSlider,
  Tooltip,
  Badge,
} from "@shopify/polaris";
import { ArrowLeftIcon, ResetIcon } from "@shopify/polaris-icons";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import { getStoreSettings, updateStoreSettings } from "../models/settings.server";
import { TEMPLATES } from "../lib/templates";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ─── Sample FAQ Data for Preview ───
const SAMPLE_FAQS = [
  {
    question: "How long does shipping take?",
    answer:
      "Most orders are processed within 24 hours. Domestic shipping usually takes 3-5 business days. International shipping can take 7-14 business days depending on the destination.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 30-day money-back guarantee. If you are not completely satisfied with your purchase, you can return it within 30 days for a full refund or exchange.",
  },
  {
    question: "Do you offer international shipping?",
    answer:
      "Yes, we ship to over 100 countries worldwide. Shipping costs and estimated delivery times vary by destination and are calculated at checkout.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order ships, you'll receive a confirmation email with a tracking number. You can use this number to track your package on our website or the carrier's website.",
  },
];

// ─── Font Options ───
const FONT_OPTIONS = [
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Outfit", value: "Outfit" },
  { label: "Poppins", value: "Poppins" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "System Default", value: "-apple-system, BlinkMacSystemFont, sans-serif" },
];

const SHADOW_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
];

const HOVER_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Lift", value: "lift" },
  { label: "Glow", value: "glow" },
  { label: "Border Highlight", value: "border" },
];

const ICON_OPTIONS = [
  { label: "Chevron ›", value: "chevron" },
  { label: "Plus / Minus", value: "plus" },
  { label: "Arrow ↓", value: "arrow" },
];

const WEIGHT_OPTIONS = [
  { label: "Normal (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semi-Bold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
];

// ─── Loader ───
export const loader = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const templateId = params.id;

  const template = TEMPLATES.find((t) => t.id === templateId);
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
    if (appSubscriptions.some((sub) => sub.name === PLAN_PRO)) {
      activePlan = "Pro";
    } else if (appSubscriptions.some((sub) => sub.name === PLAN_STARTER)) {
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
    let allSettings = JSON.parse(settings.templateSettings || "{}");
    // Handle backwards compatibility for old flat structures
    if (!allSettings.classic && !allSettings.grid && !allSettings.split && !allSettings.card && !allSettings.masonry && !allSettings.dark && Object.keys(allSettings).length > 0) {
      allSettings = { [settings.activeTemplate]: allSettings };
    }
    
    if (allSettings[template.id]) {
      savedSettings = allSettings[template.id];
    } else {
      savedSettings = template.defaultSettings;
    }
  } catch {
    savedSettings = template.defaultSettings;
  }

  return json({
    template,
    savedSettings,
    isCurrentlyActive: settings.activeTemplate === template.id,
    isUnlocked,
  });
};

// ─── Action ───
export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const templateId = params.id;

  const formData = await request.formData();
  const intent = formData.get("intent");
  const templateSettings = formData.get("templateSettings");

  if (intent === "save" || intent === "apply") {
    const currentSettings = await getStoreSettings(shop);
    let allSettings = {};
    try {
      allSettings = JSON.parse(currentSettings.templateSettings || "{}");
      if (!allSettings.classic && !allSettings.grid && !allSettings.split && !allSettings.card && !allSettings.masonry && !allSettings.dark && Object.keys(allSettings).length > 0) {
        allSettings = { [currentSettings.activeTemplate]: allSettings };
      }
    } catch {
      allSettings = {};
    }

    // Merge in the new settings for this specific template
    allSettings[templateId] = JSON.parse(templateSettings);

    const updateData = { templateSettings: JSON.stringify(allSettings) };
    
    // Optionally keep 'apply' to set the fallback activeTemplate if needed
    if (intent === "apply") {
      updateData.activeTemplate = templateId;
    }

    await updateStoreSettings(shop, updateData);
  }

  return json({ success: true, intent });
};

// ─── Color Picker Component ───
function ColorPickerField({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1 }}>
        <TextField
          label={label}
          value={value || ""}
          onChange={onChange}
          autoComplete="off"
          connectedLeft={
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                backgroundColor: value || "#000000",
                border: "2px solid #d1d5db",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <input
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  border: "none",
                  padding: 0,
                }}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}

// ─── Collapsible Section Component ───
function SettingsSection({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: open ? "16px" : "0",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "14px 0",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          color: "#1f2937",
          letterSpacing: "0.01em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>{icon}</span>
          {title}
        </span>
        <span
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          ▼
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? "1000px" : "0",
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "4px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Shadow Helper ───
function getShadow(level) {
  switch (level) {
    case "sm":
      return "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)";
    case "md":
      return "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)";
    case "lg":
      return "0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.08)";
    default:
      return "none";
  }
}

// ─── Icon Renderer ───
function FaqIcon({ style: iconStyle, color, isOpen }) {
  const s = { color: color || "#6b7280", fontSize: "18px", fontWeight: "bold", transition: "transform 0.25s ease" };
  if (iconStyle === "plus") {
    return <span style={s}>{isOpen ? "−" : "+"}</span>;
  }
  if (iconStyle === "arrow") {
    return (
      <span style={{ ...s, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>↓</span>
    );
  }
  // chevron default
  return (
    <span style={{ ...s, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>›</span>
  );
}

// ─── Google Font Loader ───
function FontLoader({ fontFamily }) {
  if (!fontFamily || fontFamily.startsWith("-apple-system")) return null;
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
  return <link rel="stylesheet" href={fontUrl} />;
}

// ─── Main Component ───
export default function TemplateEditor() {
  const { template, savedSettings, isCurrentlyActive, isUnlocked } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const [draftSettings, setDraftSettings] = useState(savedSettings);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const initialSettingsRef = useRef(JSON.stringify(savedSettings));

  const hasChanges = useMemo(
    () => JSON.stringify(draftSettings) !== initialSettingsRef.current,
    [draftSettings]
  );

  const isSaving = fetcher.state !== "idle";

  // Show success toast when save completes
  useEffect(() => {
    if (fetcher.data?.success) {
      const msg = "Template settings saved! You can select this template from the Theme Editor.";
      shopify.toast.show(msg);
      initialSettingsRef.current = JSON.stringify(draftSettings);
    }
  }, [fetcher.data]);

  // Warn about unsaved changes
  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasChanges) {
          event.preventDefault();
          return "You have unsaved changes. Are you sure you want to leave?";
        }
      },
      [hasChanges]
    )
  );

  const updateSetting = (key, value) => {
    setDraftSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!isUnlocked) {
      navigate("/app/billing");
      return;
    }
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("templateSettings", JSON.stringify(draftSettings));
    fetcher.submit(formData, { method: "post" });
  };

  const handleApply = () => {
    if (!isUnlocked) {
      navigate("/app/billing");
      return;
    }
    const formData = new FormData();
    formData.append("intent", "apply");
    formData.append("templateSettings", JSON.stringify(draftSettings));
    fetcher.submit(formData, { method: "post" });
  };

  const handleReset = () => {
    setDraftSettings({ ...template.defaultSettings });
  };

  // ─── Derived preview styles ───
  const ds = draftSettings;
  const previewWidth = previewMode === "mobile" ? "375px" : "100%";

  return (
    <Page fullWidth>
      <FontLoader fontFamily={ds.fontFamily} />

      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

      {/* ─── Top Action Bar ─── */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="editor-back-btn" onClick={() => navigate("/app/templates")} disabled={isNavigating || isSaving}>
            <span>←</span>
          </button>
          <div>
            <Text variant="headingLg" as="h1">{template.name}</Text>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }}>
              <Badge tone="info">
                {template.tier.toUpperCase()}
              </Badge>
              {hasChanges && <Badge tone="attention">Unsaved Changes</Badge>}
            </div>
          </div>
        </div>
        <div className="editor-topbar-right">
          <Button onClick={handleReset} disabled={isSaving} icon={ResetIcon}>
            Reset
          </Button>
          {isUnlocked ? (
            <Button onClick={handleSave} disabled={isSaving} loading={isSaving && fetcher.formData?.get("intent") === "save"}>
              Save
            </Button>
          ) : (
            <Button onClick={() => navigate("/app/billing")}>
              🔒 Upgrade
            </Button>
          )}

        </div>
      </div>

      <Divider />

      {/* ─── Editor Body ─── */}
      <div className="editor-body">
        {/* ─── Left: Settings Panel ─── */}
        <div className="editor-sidebar">
          <div className="editor-sidebar-inner">
            {/* Colors */}
            <SettingsSection title="Colors" icon="🎨">
              <ColorPickerField label="Primary Color" value={ds.primaryColor} onChange={(v) => updateSetting("primaryColor", v)} />
              <ColorPickerField label="Secondary Color" value={ds.secondaryColor} onChange={(v) => updateSetting("secondaryColor", v)} />
              <ColorPickerField label="Background" value={ds.backgroundColor} onChange={(v) => updateSetting("backgroundColor", v)} />
              <ColorPickerField label="Text Color" value={ds.textColor} onChange={(v) => updateSetting("textColor", v)} />
              <ColorPickerField label="Card Background" value={ds.cardBackground} onChange={(v) => updateSetting("cardBackground", v)} />
              <ColorPickerField label="Border Color" value={ds.borderColor} onChange={(v) => updateSetting("borderColor", v)} />
            </SettingsSection>

            {/* Typography */}
            <SettingsSection title="Typography" icon="🔤">
              <Select
                label="Font Family"
                options={FONT_OPTIONS}
                value={ds.fontFamily || "Inter"}
                onChange={(v) => updateSetting("fontFamily", v)}
              />
              <RangeSlider
                label={`Heading Size: ${ds.headingFontSize || 24}px`}
                value={parseInt(ds.headingFontSize) || 24}
                min={16}
                max={40}
                step={1}
                onChange={(v) => updateSetting("headingFontSize", String(v))}
                output
              />
              <RangeSlider
                label={`Body Size: ${ds.bodyFontSize || 15}px`}
                value={parseInt(ds.bodyFontSize) || 15}
                min={12}
                max={22}
                step={1}
                onChange={(v) => updateSetting("bodyFontSize", String(v))}
                output
              />
              <Select
                label="Question Font Weight"
                options={WEIGHT_OPTIONS}
                value={ds.questionFontWeight || "600"}
                onChange={(v) => updateSetting("questionFontWeight", v)}
              />
            </SettingsSection>

            {/* Layout */}
            <SettingsSection title="Layout" icon="📐">
              <RangeSlider
                label={`Border Radius: ${ds.borderRadius || 6}px`}
                value={parseInt(ds.borderRadius) || 6}
                min={0}
                max={24}
                step={1}
                onChange={(v) => updateSetting("borderRadius", String(v))}
                output
              />
              <RangeSlider
                label={`Card Padding: ${ds.cardPadding || 20}px`}
                value={parseInt(ds.cardPadding) || 20}
                min={8}
                max={40}
                step={2}
                onChange={(v) => updateSetting("cardPadding", String(v))}
                output
              />
              <RangeSlider
                label={`Item Spacing: ${ds.itemSpacing || 12}px`}
                value={parseInt(ds.itemSpacing) || 12}
                min={4}
                max={24}
                step={2}
                onChange={(v) => updateSetting("itemSpacing", String(v))}
                output
              />
              <RangeSlider
                label={`Max Width: ${ds.containerMaxWidth || 800}px`}
                value={parseInt(ds.containerMaxWidth) || 800}
                min={600}
                max={1200}
                step={50}
                onChange={(v) => updateSetting("containerMaxWidth", String(v))}
                output
              />
            </SettingsSection>

            {/* FAQ Card Style */}
            <SettingsSection title="FAQ Card Style" icon="🃏" defaultOpen={false}>
              <Select
                label="Card Shadow"
                options={SHADOW_OPTIONS}
                value={ds.cardShadow || "sm"}
                onChange={(v) => updateSetting("cardShadow", v)}
              />
              <RangeSlider
                label={`Border Width: ${ds.cardBorderWidth || 1}px`}
                value={parseInt(ds.cardBorderWidth) || 1}
                min={0}
                max={3}
                step={1}
                onChange={(v) => updateSetting("cardBorderWidth", String(v))}
                output
              />
              <Select
                label="Hover Effect"
                options={HOVER_OPTIONS}
                value={ds.cardHoverEffect || "lift"}
                onChange={(v) => updateSetting("cardHoverEffect", v)}
              />
            </SettingsSection>

            {/* Icon Style */}
            <SettingsSection title="Toggle Icon" icon="➕" defaultOpen={false}>
              <Select
                label="Icon Type"
                options={ICON_OPTIONS}
                value={ds.iconStyle || "chevron"}
                onChange={(v) => updateSetting("iconStyle", v)}
              />
              <ColorPickerField label="Icon Color" value={ds.iconColor} onChange={(v) => updateSetting("iconColor", v)} />
            </SettingsSection>
          </div>
        </div>

        {/* ─── Right: Live Preview ─── */}
        <div className="editor-preview-area">
          {/* Preview Toolbar */}
          <div className="preview-toolbar">
            <Text variant="headingSm" as="h3" tone="subdued">
              LIVE PREVIEW
            </Text>
            <div className="preview-mode-toggle">
              <button
                className={`mode-btn ${previewMode === "desktop" ? "active" : ""}`}
                onClick={() => setPreviewMode("desktop")}
              >
                🖥 Desktop
              </button>
              <button
                className={`mode-btn ${previewMode === "mobile" ? "active" : ""}`}
                onClick={() => setPreviewMode("mobile")}
              >
                📱 Mobile
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="preview-wrapper" style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="preview-container"
              style={{
                width: previewWidth,
                maxWidth: `${ds.containerMaxWidth || 800}px`,
                backgroundColor: ds.backgroundColor || "#fff",
                fontFamily: ds.fontFamily || "Inter, sans-serif",
                padding: "40px 30px",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                border: "1px solid #e5e7eb",
                minHeight: "500px",
              }}
            >
              {/* FAQ Heading */}
              <h2
                style={{
                  color: ds.primaryColor || "#1a1a2e",
                  fontSize: `${ds.headingFontSize || 24}px`,
                  fontWeight: "700",
                  marginBottom: `${parseInt(ds.itemSpacing || 12) * 2}px`,
                  fontFamily: ds.fontFamily || "Inter, sans-serif",
                  letterSpacing: "-0.02em",
                  textAlign: template.id === "grid" || template.id === "masonry" ? "center" : "left",
                }}
              >
                Frequently Asked Questions
              </h2>

              {/* FAQ Items — render based on template type */}
              {template.id === "grid" || template.id === "masonry" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: template.id === "masonry"
                      ? `repeat(${previewMode === "mobile" ? 1 : 3}, 1fr)`
                      : `repeat(${previewMode === "mobile" ? 1 : 2}, 1fr)`,
                    gap: `${ds.itemSpacing || 12}px`,
                  }}
                >
                  {SAMPLE_FAQS.map((faq, i) => (
                    <div
                      key={i}
                      className={`faq-card-preview hover-${ds.cardHoverEffect || "lift"}`}
                      style={{
                        backgroundColor: ds.cardBackground || "#fff",
                        border: `${ds.cardBorderWidth || 1}px solid ${ds.borderColor || "#e5e7eb"}`,
                        borderRadius: `${ds.borderRadius || 6}px`,
                        padding: `${ds.cardPadding || 20}px`,
                        boxShadow: getShadow(ds.cardShadow),
                        transition: "all 0.25s ease",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: `${parseInt(ds.bodyFontSize || 15) + 1}px`,
                          fontWeight: ds.questionFontWeight || "600",
                          color: ds.textColor || "#333",
                          display: "block",
                          marginBottom: "10px",
                          lineHeight: "1.4",
                        }}
                      >
                        {faq.question}
                      </strong>
                      <p
                        style={{
                          fontSize: `${ds.bodyFontSize || 15}px`,
                          color: ds.textColor || "#333",
                          opacity: 0.75,
                          lineHeight: "1.6",
                          margin: 0,
                        }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Accordion / Card / Split / Dark — all render as accordion items */
                <div style={{ display: "flex", flexDirection: "column", gap: `${ds.itemSpacing || 12}px` }}>
                  {SAMPLE_FAQS.map((faq, i) => {
                    const isOpen = openFaqIndex === i;
                    return (
                      <div
                        key={i}
                        className={`faq-card-preview hover-${ds.cardHoverEffect || "lift"}`}
                        style={{
                          backgroundColor: ds.cardBackground || "#fff",
                          border: `${ds.cardBorderWidth || 1}px solid ${isOpen ? ds.primaryColor || "#1a1a2e" : ds.borderColor || "#e5e7eb"}`,
                          borderRadius: `${ds.borderRadius || 6}px`,
                          boxShadow: getShadow(ds.cardShadow),
                          overflow: "hidden",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? -1 : i)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            padding: `${ds.cardPadding || 20}px`,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              fontSize: `${parseInt(ds.bodyFontSize || 15) + 1}px`,
                              fontWeight: ds.questionFontWeight || "600",
                              color: ds.textColor || "#333",
                              lineHeight: "1.4",
                              flex: 1,
                              paddingRight: "12px",
                              fontFamily: ds.fontFamily || "Inter, sans-serif",
                            }}
                          >
                            {faq.question}
                          </span>
                          <FaqIcon style={ds.iconStyle} color={ds.iconColor} isOpen={isOpen} />
                        </button>
                        <div
                          style={{
                            maxHeight: isOpen ? "300px" : "0",
                            overflow: "hidden",
                            transition: "max-height 0.3s ease",
                          }}
                        >
                          <div
                            style={{
                              padding: `0 ${ds.cardPadding || 20}px ${ds.cardPadding || 20}px`,
                              fontSize: `${ds.bodyFontSize || 15}px`,
                              color: ds.textColor || "#333",
                              opacity: 0.75,
                              lineHeight: "1.7",
                              fontFamily: ds.fontFamily || "Inter, sans-serif",
                            }}
                          >
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

// ─── Error Boundary ───
export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Template Editor Error:", error);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card padding="400">
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2" tone="critical">
                Failed to load template editor
              </Text>
              <Text as="p">{error?.message || "An unknown error occurred."}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// ─── Styles ───
const EDITOR_STYLES = `
  .editor-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    flex-wrap: wrap;
    gap: 12px;
  }
  .editor-topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .editor-topbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .editor-back-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid #d1d5db;
    background: #fff;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    color: #374151;
  }
  .editor-back-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
  .editor-body {
    display: flex;
    gap: 0;
    min-height: calc(100vh - 140px);
    margin-top: 16px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #fff;
  }
  .editor-sidebar {
    width: 380px;
    flex-shrink: 0;
    border-right: 1px solid #e5e7eb;
    background: #fafbfc;
    overflow-y: auto;
    max-height: calc(100vh - 140px);
  }
  .editor-sidebar-inner {
    padding: 20px;
  }
  .editor-preview-area {
    flex: 1;
    background: #f1f3f5;
    overflow-y: auto;
    max-height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;
  }
  .preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }
  .preview-mode-toggle {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #d1d5db;
  }
  .mode-btn {
    padding: 6px 16px;
    border: none;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.15s ease;
  }
  .mode-btn.active {
    background: #111827;
    color: #fff;
  }
  .mode-btn:not(.active):hover {
    background: #f3f4f6;
  }
  .preview-wrapper {
    flex: 1;
    padding: 32px 24px;
    overflow-y: auto;
  }
  .faq-card-preview {
    transition: all 0.25s ease;
  }
  .faq-card-preview.hover-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
  }
  .faq-card-preview.hover-glow:hover {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.25) !important;
  }
  .faq-card-preview.hover-border:hover {
    border-color: #6366f1 !important;
  }

  /* Scrollbar styling */
  .editor-sidebar::-webkit-scrollbar,
  .editor-preview-area::-webkit-scrollbar {
    width: 6px;
  }
  .editor-sidebar::-webkit-scrollbar-thumb,
  .editor-preview-area::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  .editor-sidebar::-webkit-scrollbar-track,
  .editor-preview-area::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .editor-body {
      flex-direction: column;
    }
    .editor-sidebar {
      width: 100%;
      max-height: 400px;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }
    .editor-topbar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
