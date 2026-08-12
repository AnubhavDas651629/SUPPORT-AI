"use client";

import React, { useState } from "react";
import { Code, Copy, CheckCircle2, Terminal, FileCode } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";

export function SdkCodeSnippetsTab() {
  const { currentOrg } = useOrganization();
  const [lang, setLang] = useState<"curl" | "python" | "node">("python");
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `# 1. Send streaming chat query via API Key
curl -X POST "http://localhost:8000/api/v1/widget/chat/stream" \\
  -H "X-API-Key: sk_live_YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What is the return policy for defective items?"
  }'`,

    python: `import hmac
import hashlib
import requests

API_KEY = "sk_live_YOUR_API_KEY_HERE"
ORG_ID = "${currentOrg?.id || "YOUR_ORG_ID"}"

# Send AI query with knowledge base RAG
response = requests.post(
    "http://localhost:8000/api/v1/widget/chat/stream",
    headers={"X-API-Key": API_KEY},
    json={"message": "Do you ship internationally?"},
    stream=True
)

for chunk in response.iter_content(chunk_size=128):
    if chunk:
        print(chunk.decode("utf-8"), end="", flush=True)

# HMAC Webhook Signature Verification Example:
def verify_webhook(payload_body: bytes, signature_header: str, secret: str) -> bool:
    computed = hmac.new(secret.encode(), payload_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, signature_header)
`,

    node: `const crypto = require('crypto');

const API_KEY = "sk_live_YOUR_API_KEY_HERE";

// Verify incoming webhook signature
function verifyWebhookSignature(rawBody, signatureHeader, signingSecret) {
  const hmac = crypto.createHmac('sha256', signingSecret);
  const digest = hmac.update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}

// Fetch escalated tickets
async function getEscalatedTickets() {
  const res = await fetch("http://localhost:8000/api/v1/tickets?status=OPEN", {
    headers: { "X-API-Key": API_KEY }
  });
  const data = await res.json();
  console.log("Open tickets:", data.items);
}
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Developer SDKs & Code Snippets</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy ready-to-run examples for AI chat streaming and HMAC webhook verification.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(["python", "curl", "node"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  lang === l
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="p-4 bg-slate-950 text-slate-100 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner relative group">
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition shrink-0 cursor-pointer flex items-center gap-1 font-sans font-semibold text-xs shadow-xs"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>

          <pre className="text-emerald-300 leading-relaxed pr-24">{snippets[lang]}</pre>
        </div>
      </div>
    </div>
  );
}
