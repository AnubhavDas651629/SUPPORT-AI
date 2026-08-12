import { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Setup Workspace & Onboarding | Support AI",
  description: "Set up your company workspace, upload knowledge base documentation, and deploy your AI support agent.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
