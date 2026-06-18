import React, { useState } from "react";
import { Modal, TextField, Button, LegacyCard, ResourceList, ResourceItem, Text, ButtonGroup } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";

export function CategoryManager({ open, categories, onClose, onSave, onDelete }) {
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onSave({ name: newCategoryName.trim() });
      setNewCategoryName("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Categories"
      primaryAction={{ content: "Close", onAction: onClose }}
    >
      <Modal.Section>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <TextField
              value={newCategoryName}
              onChange={setNewCategoryName}
              placeholder="New category name"
              autoComplete="off"
            />
          </div>
          <Button onClick={handleAdd} disabled={!newCategoryName.trim()}>Add Category</Button>
        </div>
        
        <LegacyCard>
          <ResourceList
            resourceName={{ singular: 'category', plural: 'categories' }}
            items={categories}
            renderItem={(item) => {
              const { id, name } = item;
              return (
                <ResourceItem id={id} onClick={() => {}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {name}
                    </Text>
                    <ButtonGroup>
                      <Button icon={DeleteIcon} tone="critical" onClick={(e) => { e.stopPropagation(); onDelete(id); }} />
                    </ButtonGroup>
                  </div>
                </ResourceItem>
              );
            }}
          />
        </LegacyCard>
      </Modal.Section>
    </Modal>
  );
}
