import React from "react";
import { Badge } from "@shopify/polaris";

export function PlanBadge({ plan }) {
  const planInfo = {
    free: { tone: "info", text: "Free Plan" },
    basic: { tone: "success", text: "Basic Plan" },
    pro: { tone: "magic", text: "Pro Plan" },
  };

  const { tone, text } = planInfo[plan] || planInfo.free;

  return <Badge tone={tone}>{text}</Badge>;
}
