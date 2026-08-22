"use client";

import { PageHeader } from "@/components/ui/Panel";
import { ApiKeys } from "@/components/developers/ApiKeys";
import { Webhooks } from "@/components/developers/Webhooks";
import { IntegrationGuide } from "@/components/developers/IntegrationGuide";

export default function DevelopersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Developers"
        description="Keys, webhooks and the snippets to wire Support-AI into your own systems."
      />
      <ApiKeys />
      <Webhooks />
      <IntegrationGuide />
    </div>
  );
}
