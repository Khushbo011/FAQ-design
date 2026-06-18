import React, { useState, useCallback } from "react";
import { Modal, Tabs, Button, DropZone, BlockStack, Text, DataTable, Banner } from "@shopify/polaris";
import { ImportIcon, ExportIcon } from "@shopify/polaris-icons";

export function ImportExportModal({ open, onClose, onImport, onExportCsv, onExportJson }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);

  const handleTabChange = (selectedTabIndex) => setSelectedTab(selectedTabIndex);

  const handleDropZoneDrop = useCallback((dropFiles) => {
    const uploadedFile = dropFiles[0];
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (uploadedFile.name.endsWith('.csv')) {
        // Simple CSV parser for preview
        const lines = content.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 1) {
          const headers = lines[0].split(',');
          const data = lines.slice(1, 6).map(line => {
             const cols = line.split(',');
             return cols.slice(0, 4); // Preview up to 4 columns
          });
          setPreview(data);
        }
      } else if (uploadedFile.name.endsWith('.json')) {
        try {
          const json = JSON.parse(content);
          if (Array.isArray(json)) {
            const data = json.slice(0, 5).map(item => [item.question, item.answer?.substring(0, 50), item.categoryName, item.isActive?.toString()]);
            setPreview(data);
          }
        } catch (e) {
          console.error("Invalid JSON");
        }
      }
    };
    reader.readAsText(uploadedFile);
  }, []);

  const tabs = [
    { id: 'import', content: 'Import', accessibilityLabel: 'Import data' },
    { id: 'export', content: 'Export', accessibilityLabel: 'Export data' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import / Export FAQs"
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />
      <Modal.Section>
        {selectedTab === 0 ? (
          <BlockStack gap="400">
            <DropZone onDrop={handleDropZoneDrop} accept=".csv, .json">
              {file ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Text variant="bodyMd">{file.name}</Text>
                </div>
              ) : (
                <DropZone.FileUpload actionTitle="Add file" actionHint="Accepts .csv or .json" />
              )}
            </DropZone>
            <Text tone="subdued">CSV format: question, answer, category, active</Text>
            
            {preview.length > 0 && (
               <div style={{ marginTop: '20px' }}>
                 <Text variant="headingSm">Preview (first 5 rows)</Text>
                 <DataTable
                   columnContentTypes={['text', 'text', 'text', 'text']}
                   headings={['Question', 'Answer', 'Category', 'Active']}
                   rows={preview}
                 />
                 <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                   <Button variant="primary" onClick={() => onImport(file)}>Import FAQs</Button>
                 </div>
               </div>
            )}
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            <Banner title="Export your FAQs" tone="info">
              <p>Download a backup of your FAQs. JSON format includes rich text HTML.</p>
            </Banner>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <Button icon={ExportIcon} onClick={onExportCsv}>Export as CSV</Button>
              <Button icon={ExportIcon} onClick={onExportJson}>Export as JSON</Button>
            </div>
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  );
}
