import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, BlockStack, Icon, Box } from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO],
    isTest: true,
  });

  let activePlan = "Free";
  if (hasActivePayment) {
    if (appSubscriptions.some(sub => sub.name === PLAN_PRO)) {
      activePlan = "Pro Plan";
    } else if (appSubscriptions.some(sub => sub.name === PLAN_STARTER)) {
      activePlan = "Starter Plan";
    }
  }

  return json({ activePlan, success: hasActivePayment });
};

export default function ApprovalPage() {
  const { activePlan, success } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Box paddingBlockStart="800">
            <Card>
              <BlockStack align="center" inlineAlign="center" gap="500">
                <div style={{ color: 'var(--p-color-icon-success)', padding: '20px' }}>
                  <Icon source={CheckCircleIcon} tone="success" />
                </div>
                
                <Text variant="headingXl" as="h1" alignment="center">
                  {success ? "Subscription Activated!" : "Subscription Update Pending"}
                </Text>
                
                <Text variant="bodyLg" as="p" tone="subdued" alignment="center">
                  {success 
                    ? `You are now subscribed to the ${activePlan}. All premium features and templates are unlocked and ready to use.`
                    : "We're waiting for your subscription to be confirmed. Please check back in a few moments."}
                </Text>
                
                <Box paddingBlockStart="400">
                  <Button size="large" variant="primary" onClick={() => navigate("/app/templates")}>
                    Go to Templates Gallery
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
