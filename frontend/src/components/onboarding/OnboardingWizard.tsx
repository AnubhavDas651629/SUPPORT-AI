"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  BookOpen,
  Sliders,
  Tag,
  Check,
  ArrowLeft,
  ArrowRight,
  Upload,
  Copy,
  CheckCircle2,
  FileText,
  HelpCircle,
  LogOut,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";

type Step = 1 | 2 | 3 | 4;

const COLOR_PRESETS = [
  { name: "Magenta Pink", hex: "#C026D3" },
  { name: "Electric Indigo", hex: "#6366F1" },
  { name: "Ocean Blue", hex: "#0EA5E9" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Slate Black", hex: "#0F172A" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if user already has an organization -> only redirect if not creating a new one
  React.useEffect(() => {
    async function checkExistingOrg() {
      const isExplicitNew = typeof window !== "undefined" && window.location.search.includes("new=true");
      if (isExplicitNew) {
        setIsCheckingExisting(false);
        return;
      }

      try {
        const res = await api.get("/organizations");
        if (Array.isArray(res.data) && res.data.length > 0) {
          router.replace("/dashboard");
          return;
        }
      } catch (e) {
        // If unauthenticated, redirect to login
      } finally {
        setIsCheckingExisting(false);
      }
    }
    checkExistingOrg();
  }, [router]);

  // Step 1 State: Workspace
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [supportEmail, setSupportEmail] = useState(user?.email ? `support@${user.email.split("@")[1] || "acme.com"}` : "support@acme.com");
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  // Step 2 State: Knowledge Base
  const [kbName, setKbName] = useState("Help Center & Customer Policies");
  const [kbDescription, setKbDescription] = useState("Official product documentation, refund terms, and shipping guidelines.");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [createdKbId, setCreatedKbId] = useState<string | null>(null);

  // Step 3 State: AI Agent & Branding
  const [widgetTitle, setWidgetTitle] = useState("Acme Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi there! How can we help you today?");
  const [primaryColor, setPrimaryColor] = useState("#C026D3");

  // Step 4 State: API Key & Launch
  const [generatedApiKey, setGeneratedApiKey] = useState("sk_live_demo_onboarding_key_7789a");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Auto-generate slug from workspace name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrgName(val);
    setOrgSlug(val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    if (!widgetTitle || widgetTitle === "Acme Assistant") {
      setWidgetTitle(`${val} Assistant`);
    }
  };

  // Step 1 Submission: Create Organization
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.post("/organizations", {
        name: orgName.trim(),
      });
      setCreatedOrgId(response.data.id);
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Could not create workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Submission: Create Knowledge Base
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbName.trim() || !createdOrgId) {
      setCurrentStep(3);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.post(`/organizations/${createdOrgId}/knowledge-bases`, {
        name: kbName.trim(),
        description: kbDescription.trim(),
      });
      setCreatedKbId(response.data.id);

      // If document was selected, upload it
      if (uploadedFile && response.data.id) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        await api.post(`/organizations/${createdOrgId}/knowledge-bases/${response.data.id}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setCurrentStep(3);
    } catch (err: any) {
      // If feature requires higher plan or fails, proceed gracefully
      console.warn("KB creation note:", err);
      setCurrentStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 Submission: Configure Settings
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (createdOrgId) {
        // Update widget branding settings
        await api.patch(`/organizations/${createdOrgId}/settings`, {
          widget_title: widgetTitle,
          welcome_message: welcomeMessage,
          primary_color: primaryColor,
        });

        // Generate live API Key for step 4
        try {
          const keyRes = await api.post(`/organizations/${createdOrgId}/api-keys`, {
            name: `${orgName || "Production"} Widget Key`,
          });
          if (keyRes.data?.secret_key) {
            setGeneratedApiKey(keyRes.data.secret_key);
          }
        } catch (keyErr) {
          console.warn("API key generation note:", keyErr);
        }
      }
      setCurrentStep(4);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#C026D3", "#6366F1", "#10B981"],
      });
    } catch (err: any) {
      console.warn("Settings note:", err);
      setCurrentStep(4);
    } finally {
      setIsLoading(false);
    }
  };

  // Final Launch
  const handleFinish = () => {
    if (createdOrgId && typeof window !== "undefined") {
      localStorage.setItem("support_ai_active_org_id", createdOrgId);
    }
    router.push("/dashboard");
  };

  const copyToClipboard = (text: string, type: "key" | "script") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const embedScriptCode = `<script src="http://localhost:8000/static/widget.js" data-api-key="${generatedApiKey}" defer></script>`;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200/80 px-6 sm:px-12 py-3.5 flex items-center justify-between shadow-xs">
        <Logo height={32} width={140} />

        <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline">
            Login as <strong className="text-slate-900 font-semibold">{user?.email || "user@org.com"}</strong>
          </span>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <button
            type="button"
            onClick={() => alert("Support AI Onboarding Assistance: Contact support@supportai.com")}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Assistance</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="w-full max-w-6xl mx-auto p-4 sm:p-8 my-auto">
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* Left Column: Stepper Navigation (4 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-b from-[#FDF2F8]/60 via-[#F5F3FF]/40 to-slate-50 border-r border-slate-100 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Alert Info Banner */}
              <div className="flex items-start gap-2.5 p-3 bg-white/90 rounded-2xl border border-slate-200/60 shadow-xs mb-8 text-xs text-slate-600">
                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 text-[10px]">
                  i
                </span>
                <span>Get started by setting up your workspace and AI support profile.</span>
              </div>

              {/* Vertical Stepper */}
              <div className="space-y-6 relative">
                {/* Vertical Connecting Line */}
                <div className="absolute top-4 left-5 bottom-6 w-0.5 bg-slate-200 -z-0">
                  <div
                    className="w-full bg-fuchsia-600 transition-all duration-500"
                    style={{
                      height:
                        currentStep === 1 ? "0%" : currentStep === 2 ? "33%" : currentStep === 3 ? "66%" : "100%",
                    }}
                  />
                </div>

                {/* Step 1 Item */}
                <div className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all shadow-xs ${
                      currentStep > 1
                        ? "bg-fuchsia-600 text-white"
                        : currentStep === 1
                        ? "bg-fuchsia-600 text-white ring-4 ring-fuchsia-100"
                        : "bg-white border border-slate-200 text-slate-400"
                    }`}
                  >
                    {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        currentStep === 1 ? "text-slate-900 font-semibold" : "text-slate-700"
                      }`}
                    >
                      Add Workspace
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Set up your company workspace and support email to manage inquiries.
                    </p>
                  </div>
                </div>

                {/* Step 2 Item */}
                <div className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all shadow-xs ${
                      currentStep > 2
                        ? "bg-fuchsia-600 text-white"
                        : currentStep === 2
                        ? "bg-fuchsia-600 text-white ring-4 ring-fuchsia-100"
                        : "bg-white border border-slate-200 text-slate-400"
                    }`}
                  >
                    {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        currentStep === 2 ? "text-slate-900 font-semibold" : "text-slate-700"
                      }`}
                    >
                      Knowledge Base
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Upload your company policies and FAQs for instant 24/7 AI retrieval.
                    </p>
                  </div>
                </div>

                {/* Step 3 Item */}
                <div className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all shadow-xs ${
                      currentStep > 3
                        ? "bg-fuchsia-600 text-white"
                        : currentStep === 3
                        ? "bg-fuchsia-600 text-white ring-4 ring-fuchsia-100"
                        : "bg-white border border-slate-200 text-slate-400"
                    }`}
                  >
                    {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : <Sliders className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        currentStep === 3 ? "text-slate-900 font-semibold" : "text-slate-700"
                      }`}
                    >
                      AI Assistant & Branding
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Customize bot title, brand theme color, and initial welcome greeting.
                    </p>
                  </div>
                </div>

                {/* Step 4 Item */}
                <div className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all shadow-xs ${
                      currentStep === 4
                        ? "bg-fuchsia-600 text-white ring-4 ring-fuchsia-100"
                        : "bg-white border border-slate-200 text-slate-400"
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        currentStep === 4 ? "text-slate-900 font-semibold" : "text-slate-700"
                      }`}
                    >
                      Deploy Widget & API
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Get your live embed script tag and activate your production API key.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Graphic Ornament */}
            <div className="pt-6 text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-fuchsia-600" />
              <span>Multi-tenant encrypted workspace</span>
            </div>
          </div>

          {/* Right Column: Step Content Form Area (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-10 md:p-12 flex flex-col justify-between">
            <div>
              {/* Step Counter */}
              <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-600 block mb-2">
                STEP {currentStep} OF 4
              </span>

              {errorMessage && (
                <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 1: CREATE YOUR WORKSPACE                                             */}
              {/* ========================================================================= */}
              {currentStep === 1 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Create your workspace
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
                    Set up your workspace to receive and respond to customer messages. This workspace will handle your AI support agents, document vectors, and human escalation queues.
                  </p>

                  <form id="onboarding-step1-form" onSubmit={handleStep1Submit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workspace Name</label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={handleNameChange}
                        placeholder="e.g. Acme Support"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your support email address</label>
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="e.g. support@acme.com"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Emails sent out will show your workspace name paired with your support address, for example:{" "}
                        <span className="text-slate-600 font-medium">Acme Support (support@acme.com)</span>
                      </p>
                    </div>
                  </form>

                  {/* Documentation Cards */}
                  <div className="mt-10 pt-6 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-800 block mb-3">Documentation</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <FileText className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Workspace Setup</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <Building2 className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Multi-Tenancy Guide</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <Tag className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Team Permissions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: SETUP KNOWLEDGE BASE                                              */}
              {/* ========================================================================= */}
              {currentStep === 2 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Setup Knowledge Base
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
                    Upload your product manuals, return policies, or FAQs. Support AI will automatically parse, chunk, and embed your documents using PostgreSQL pgvector.
                  </p>

                  <form id="onboarding-step2-form" onSubmit={handleStep2Submit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Knowledge Base Title</label>
                      <input
                        type="text"
                        required
                        value={kbName}
                        onChange={(e) => setKbName(e.target.value)}
                        placeholder="e.g. Acme Customer Policies"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
                      />
                    </div>

                    {/* Drag and Drop File Upload Area */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upload Initial Document (Optional)</label>
                      <label className="border-2 border-dashed border-slate-200 hover:border-fuchsia-500 bg-slate-50/50 hover:bg-fuchsia-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition">
                        <Upload className="w-8 h-8 text-fuchsia-600 mb-2" />
                        <span className="text-sm font-semibold text-slate-800">
                          {uploadedFile ? uploadedFile.name : "Click to browse or drag and drop"}
                        </span>
                        <span className="text-xs text-slate-400 mt-1">Supports PDF, TXT, or DOCX (Max 10MB)</span>
                        <input
                          type="file"
                          accept=".pdf,.txt,.docx"
                          onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </form>

                  {/* Documentation Cards */}
                  <div className="mt-10 pt-6 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-800 block mb-3">Guidance</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <FileText className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Document Formats</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <BookOpen className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>RAG Ingestion Speed</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <Sparkles className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Embedding Models</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: CONFIGURE AI AGENT & BRANDING                                     */}
              {/* ========================================================================= */}
              {currentStep === 3 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Configure AI Assistant & Branding
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
                    Personalize your floating chat widget with your brand colors, assistant title, and automated welcome greeting.
                  </p>

                  <form id="onboarding-step3-form" onSubmit={handleStep3Submit} className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                    {/* Left Inputs (7 cols) */}
                    <div className="sm:col-span-7 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assistant Title</label>
                        <input
                          type="text"
                          required
                          value={widgetTitle}
                          onChange={(e) => setWidgetTitle(e.target.value)}
                          placeholder="e.g. Acme Assistant"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Welcome Message</label>
                        <input
                          type="text"
                          required
                          value={welcomeMessage}
                          onChange={(e) => setWelcomeMessage(e.target.value)}
                          placeholder="e.g. Hi there! How can we help you today?"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand Theme Color</label>
                        <div className="flex items-center gap-2 mb-2">
                          {COLOR_PRESETS.map((p) => (
                            <button
                              key={p.hex}
                              type="button"
                              onClick={() => setPrimaryColor(p.hex)}
                              style={{ backgroundColor: p.hex }}
                              className={`w-7 h-7 rounded-full transition-all transform cursor-pointer ${
                                primaryColor === p.hex ? "ring-4 ring-slate-300 scale-110" : "hover:scale-105 opacity-90"
                              }`}
                              title={p.name}
                            />
                          ))}
                        </div>
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Right Live Mini-Preview (5 cols) */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <span className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Live Widget Preview</span>
                      <div className="w-full max-w-[240px] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        {/* Widget Header Preview */}
                        <div style={{ backgroundColor: primaryColor }} className="p-3 text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                            {orgName ? orgName.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-none">{widgetTitle || "Support Assistant"}</div>
                            <div className="text-[9px] opacity-80 mt-0.5">• Online</div>
                          </div>
                        </div>
                        {/* Widget Message Area Preview */}
                        <div className="p-3 bg-slate-50 space-y-2 text-xs">
                          <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-100 text-slate-700 text-[11px]">
                            {welcomeMessage}
                          </div>
                          <div
                            style={{ backgroundColor: primaryColor }}
                            className="p-2 rounded-xl text-white text-[11px] self-end ml-auto max-w-[80%] text-right font-medium"
                          >
                            How does shipping work?
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 4: DEPLOY WIDGET & PRODUCTION API KEY                                */}
              {/* ========================================================================= */}
              {currentStep === 4 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Deploy Widget & Launch
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                    Your workspace is fully initialized! Copy your embed code to install the widget on your website, or proceed straight to the dashboard.
                  </p>

                  <div className="space-y-4">
                    {/* Live API Key Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-700">Production API Key</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800">
                        <span className="truncate">{generatedApiKey}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(generatedApiKey, "key")}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 text-xs font-sans font-medium"
                        >
                          {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* HTML Embed Snippet */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-700">HTML Widget Script Tag</span>
                        <span className="text-[10px] text-slate-400">Paste before &lt;/body&gt;</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
                        <code className="text-[11px] truncate">{embedScriptCode}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(embedScriptCode, "script")}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 text-xs font-sans font-medium"
                        >
                          {copiedScript ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedScript ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Guidance Cards */}
                  <div className="mt-8 pt-5 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-800 block mb-3">Next Steps</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <ExternalLink className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Live Chat Testing</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <Tag className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Webhooks Console</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer">
                        <ShieldCheck className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Security & API</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Step Navigation Action Buttons */}
            <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-sm font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep === 1 && (
                <button
                  type="submit"
                  form="onboarding-step1-form"
                  disabled={isLoading || !orgName.trim()}
                  className="px-6 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white font-semibold text-sm shadow-md shadow-fuchsia-600/20 transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save and continue"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="submit"
                  form="onboarding-step2-form"
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white font-semibold text-sm shadow-md shadow-fuchsia-600/20 transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save and continue"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="submit"
                  form="onboarding-step3-form"
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white font-semibold text-sm shadow-md shadow-fuchsia-600/20 transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save and continue"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 4 && (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white font-semibold text-sm shadow-md shadow-fuchsia-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Finish Setup & Launch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
