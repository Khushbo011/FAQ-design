import React from "react";
import { Card, Text, BlockStack } from "@shopify/polaris";

export function AnalyticsCard({ title, value }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" color="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingLg">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}
