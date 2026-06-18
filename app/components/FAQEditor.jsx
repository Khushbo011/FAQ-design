import React, { useState, useEffect, Suspense, lazy } from "react";
import { Modal, TextField, Select, Checkbox, FormLayout } from "@shopify/polaris";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

export function FAQEditor({ open, faq, categories, onClose, onSave }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [question, setQuestion] = useState(faq?.question || "");
  const [answer, setAnswer] = useState(faq?.answer || "");
  const [categoryId, setCategoryId] = useState(faq?.categoryId || "");
  const [isActive, setIsActive] = useState(faq ? faq.isActive : true);

  const categoryOptions = [
    { label: "Uncategorized", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const handleSave = () => {
    onSave({ id: faq?.id, question, answer, categoryId, isActive });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={faq ? "Edit FAQ" : "Add FAQ"}
      primaryAction={{
        content: "Save",
        onAction: handleSave,
        disabled: !question || answer.length < 10,
      }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <FormLayout>
          <TextField
            label="Question"
            value={question}
            onChange={setQuestion}
            autoComplete="off"
            maxLength={300}
            showCharacterCount
          />
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>Answer</label>
            {isMounted ? (
              <Suspense fallback={<div>Loading editor...</div>}>
                <ReactQuill theme="snow" value={answer} onChange={setAnswer} />
              </Suspense>
            ) : (
              <div style={{ height: "40px", border: "1px solid #ccc" }} />
            )}
          </div>
          <Select
            label="Category"
            options={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
          />
          <Checkbox
            label="Active"
            checked={isActive}
            onChange={setIsActive}
          />
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}
