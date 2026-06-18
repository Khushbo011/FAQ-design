import React, { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { Page, Tabs, Button, Card, EmptyState, TextField, Tag, ButtonGroup, Icon, BlockStack, Layout, SkeletonPage, SkeletonBodyText } from "@shopify/polaris";
import { ListBulletedIcon, AppsIcon, CategoriesIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { getFaqs, createFaq, updateFaq, deleteFaq, updateFaqPositions } from "../models/faq.server";
import { getCategories, createCategory, deleteCategory } from "../models/category.server";
import { getAnalytics } from "../models/analytics.server";
import { PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import { FAQList } from "../components/FAQList";
import { FAQEditor } from "../components/FAQEditor";
import { CategoryManager } from "../components/CategoryManager";
import { AnalyticsCard } from "../components/AnalyticsCard";
import { ImportExportModal } from "../components/ImportExportModal";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const faqs = await getFaqs(shop);
  const categories = await getCategories(shop);
  const analytics = await getAnalytics(shop, 30);
  const { billing: shopifyBilling } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await shopifyBilling.check({
    plans: [PLAN_STARTER, PLAN_PRO],
    isTest: true,
  });

  let activePlan = "Free";
  let limit = 1; // Free
  if (hasActivePayment) {
    if (appSubscriptions.some(sub => sub.name === PLAN_PRO)) {
      activePlan = PLAN_PRO;
      limit = Infinity;
    } else if (appSubscriptions.some(sub => sub.name === PLAN_STARTER)) {
      activePlan = PLAN_STARTER;
      limit = 4;
    }
  }

  const planInfo = { activePlan, limit };

  return json({ faqs, categories, analytics, planInfo });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "createFaq") {
    const data = JSON.parse(formData.get("data"));
    await createFaq({ ...data, shop });
  } else if (actionType === "updateFaq") {
    const id = formData.get("id");
    const data = JSON.parse(formData.get("data"));
    await updateFaq(id, shop, data);
  } else if (actionType === "deleteFaq") {
    const id = formData.get("id");
    await deleteFaq(id, shop);
  } else if (actionType === "reorderFaqs") {
    const updates = JSON.parse(formData.get("updates"));
    await updateFaqPositions(shop, updates);
  } else if (actionType === "createCategory") {
    const name = formData.get("name");
    await createCategory({ name, shop });
  } else if (actionType === "deleteCategory") {
    const id = formData.get("id");
    await deleteCategory(id, shop);
  }

  return json({ success: true });
};

export default function GalleryPage() {
  const { faqs, categories, analytics, planInfo } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState(
    typeof window !== "undefined" ? localStorage.getItem("faqViewMode") || "accordion" : "accordion"
  );
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);

  const handleTabChange = useCallback((selectedTabIndex) => setSelectedTab(selectedTabIndex), []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") localStorage.setItem("faqViewMode", mode);
  };

  const handleSaveFaq = (faqData) => {
    if (faqData.id) {
      fetcher.submit({ actionType: "updateFaq", id: faqData.id, data: JSON.stringify(faqData) }, { method: "post" });
    } else {
      if (faqs.length >= planInfo.limit) {
         shopify.toast.show("Plan limit reached. Please upgrade.");
         return;
      }
      fetcher.submit({ actionType: "createFaq", data: JSON.stringify(faqData) }, { method: "post" });
    }
    setEditorOpen(false);
    setEditingFaq(null);
  };

  const handleDeleteFaq = (id) => {
    fetcher.submit({ actionType: "deleteFaq", id }, { method: "post" });
  };

  const handleReorder = (newFaqs) => {
    const updates = newFaqs.map((faq, index) => ({ id: faq.id, position: index }));
    fetcher.submit({ actionType: "reorderFaqs", updates: JSON.stringify(updates) }, { method: "post" });
  };

  const handleSaveCategory = (data) => {
    fetcher.submit({ actionType: "createCategory", name: data.name }, { method: "post" });
  };

  const handleDeleteCategory = (id) => {
    fetcher.submit({ actionType: "deleteCategory", id }, { method: "post" });
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const views = analytics.filter(a => a.event === "view").length;
  const expansions = analytics.filter(a => a.event === "expand").length;
  const helpful = analytics.filter(a => a.event === "helpful").length;
  const notHelpful = analytics.filter(a => a.event === "not_helpful").length;

  const tabs = [
    { id: 'manager', content: 'FAQ Manager' },
    { id: 'analytics', content: 'Analytics' },
  ];

  return (
    <Page
      title="Manage FAQs"
      subtitle={`${faqs.length} FAQs created`}
      primaryAction={{ content: "Create FAQ", onAction: () => { setEditingFaq(null); setEditorOpen(true); } }}
      secondaryActions={[{ content: "Import / Export", onAction: () => setImportExportOpen(true) }]}
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />
      
      {selectedTab === 0 ? (
        <BlockStack gap="400">
          <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <TextField
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={setSearchQuery}
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setSearchQuery("")}
              />
            </div>
            
            <ButtonGroup segmented>
              <Button pressed={viewMode === "accordion"} icon={ListBulletedIcon} onClick={() => handleViewModeChange("accordion")} />
              <Button pressed={viewMode === "grid"} icon={AppsIcon} onClick={() => handleViewModeChange("grid")} />
              <Button pressed={viewMode === "tabs"} icon={CategoriesIcon} onClick={() => handleViewModeChange("tabs")} />
            </ButtonGroup>
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', alignItems: 'center' }}>
            <Tag onClick={() => setSelectedCategory("all")}>All</Tag>
            {categories.map(c => (
               <Tag key={c.id} onClick={() => setSelectedCategory(c.id)}>{c.name}</Tag>
            ))}
            <Button variant="plain" onClick={() => setCategoryManagerOpen(true)}>Manage Categories</Button>
          </div>

          {faqs.length === 0 ? (
            <EmptyState
              heading="Create your first FAQ"
              action={{ content: "Create FAQ", onAction: () => { setEditingFaq(null); setEditorOpen(true); } }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Start building your FAQs to display on your storefront.</p>
            </EmptyState>
          ) : (
            <FAQList
              faqs={filteredFaqs}
              categories={categories}
              viewMode={viewMode}
              onReorder={handleReorder}
              onEdit={(faq) => { setEditingFaq(faq); setEditorOpen(true); }}
              onDelete={handleDeleteFaq}
            />
          )}
        </BlockStack>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <Layout>
            <Layout.Section oneHalf>
               <AnalyticsCard title="Total Views (30 days)" value={views} />
            </Layout.Section>
            <Layout.Section oneHalf>
               <AnalyticsCard title="Total Expansions (30 days)" value={expansions} />
            </Layout.Section>
            <Layout.Section oneHalf>
               <AnalyticsCard title="Helpful Votes" value={helpful} />
            </Layout.Section>
            <Layout.Section oneHalf>
               <AnalyticsCard title="Not Helpful Votes" value={notHelpful} />
            </Layout.Section>
          </Layout>
        </div>
      )}

      {editorOpen && (
        <FAQEditor
          open={editorOpen}
          faq={editingFaq}
          categories={categories}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveFaq}
        />
      )}

      {categoryManagerOpen && (
        <CategoryManager
          open={categoryManagerOpen}
          categories={categories}
          onClose={() => setCategoryManagerOpen(false)}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      {importExportOpen && (
        <ImportExportModal
          open={importExportOpen}
          onClose={() => setImportExportOpen(false)}
          onImport={(file) => { /* To be implemented */ setImportExportOpen(false); }}
          onExportCsv={() => { /* To be implemented */ }}
          onExportJson={() => { /* To be implemented */ }}
        />
      )}
    </Page>
  );
}
