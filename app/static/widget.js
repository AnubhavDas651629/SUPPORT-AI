(function () {
    "use strict";

    // 1. Locate Script & Extract Configuration
    const currentScript =
        document.currentScript ||
        document.querySelector("script[data-api-key]");

    if (!currentScript) {
        console.error("[SupportAI] Could not find widget <script> tag with data-api-key.");
        return;
    }

    const apiKey = currentScript.getAttribute("data-api-key");
    const apiUrl =
        currentScript.getAttribute("data-api-url") ||
        window.location.origin;

    if (!apiKey) {
        console.error("[SupportAI] Missing required 'data-api-key' attribute.");
        return;
    }

    // 2. State
    let config = {
        widget_title: "Support Assistant",
        primary_color: "#4F46E5",
        company_logo_url: null,
        welcome_message: "Hi there! How can we help you today?",
    };
    let isOpen = false;
    let isStreaming = false;
    let conversationId = localStorage.getItem("supportai_conv_id") || null;

    // 3. Inject CSS Styles
    const styles = `
    :root {
      --sai-primary: ${config.primary_color};
    }
    #supportai-widget-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
    }
    #supportai-launcher {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: var(--sai-primary);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      outline: none;
    }
    #supportai-launcher:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
    }
    #supportai-launcher svg {
      width: 28px;
      height: 28px;
      fill: #ffffff;
      transition: transform 0.2s ease;
    }
    #supportai-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 48px);
      height: 580px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.96);
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #supportai-window.sai-open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    #supportai-header {
      background: var(--sai-primary);
      color: #ffffff;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sai-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sai-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      color: #ffffff;
      overflow: hidden;
    }
    .sai-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .sai-header-text h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }
    .sai-status {
      font-size: 12px;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .sai-status-dot {
      width: 7px;
      height: 7px;
      background: #10B981;
      border-radius: 50%;
      display: inline-block;
    }
    #supportai-close-btn {
      background: none;
      border: none;
      color: #ffffff;
      cursor: pointer;
      padding: 4px;
      opacity: 0.8;
      transition: opacity 0.15s ease;
    }
    #supportai-close-btn:hover {
      opacity: 1;
    }
    #supportai-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #F9FAFB;
    }
    .sai-msg {
      max-width: 82%;
      padding: 10px 14px;
      font-size: 14px;
      line-height: 1.45;
      word-wrap: break-word;
      border-radius: 12px;
      animation: saiFadeIn 0.2s ease;
    }
    @keyframes saiFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .sai-msg-assistant {
      align-self: flex-start;
      background: #ffffff;
      color: #1F2937;
      border: 1px solid #E5E7EB;
      border-bottom-left-radius: 4px;
    }
    .sai-msg-user {
      align-self: flex-end;
      background: var(--sai-primary);
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .sai-typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      align-self: flex-start;
      width: fit-content;
    }
    .sai-typing-dot {
      width: 6px;
      height: 6px;
      background: #9CA3AF;
      border-radius: 50%;
      animation: saiBounce 1.4s infinite ease-in-out both;
    }
    .sai-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .sai-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes saiBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    #supportai-input-area {
      padding: 12px;
      background: #ffffff;
      border-top: 1px solid #E5E7EB;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #supportai-input {
      flex: 1;
      border: 1px solid #D1D5DB;
      border-radius: 20px;
      padding: 9px 14px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
      max-height: 100px;
      resize: none;
    }
    #supportai-input:focus {
      border-color: var(--sai-primary);
    }
    #supportai-send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--sai-primary);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      outline: none;
      transition: opacity 0.15s ease;
    }
    #supportai-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .sai-footer-badge {
      font-size: 11px;
      text-align: center;
      color: #9CA3AF;
      padding: 4px;
      background: #ffffff;
    }
  `;

    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // 4. Inject DOM Elements
    const container = document.createElement("div");
    container.id = "supportai-widget-container";
    container.innerHTML = `
    <div id="supportai-window">
      <div id="supportai-header">
        <div class="sai-header-info">
          <div class="sai-avatar" id="sai-avatar-box">AI</div>
          <div class="sai-header-text">
            <h3 id="sai-title">Support Assistant</h3>
            <div class="sai-status"><span class="sai-status-dot"></span> Online</div>
          </div>
        </div>
        <button id="supportai-close-btn" aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div id="supportai-messages"></div>
      <form id="supportai-input-area">
        <input type="text" id="supportai-input" placeholder="Type your message..." autocomplete="off" />
        <button type="submit" id="supportai-send-btn" aria-label="Send message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
      <div class="sai-footer-badge">Powered by <strong>SupportAI</strong></div>
    </div>
    <button id="supportai-launcher" aria-label="Open support chat">
      <svg id="sai-chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
      <svg id="sai-close-icon" style="display:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;
    document.body.appendChild(container);

    // 5. DOM References
    const launcher = document.getElementById("supportai-launcher");
    const chatWindow = document.getElementById("supportai-window");
    const closeBtn = document.getElementById("supportai-close-btn");
    const messagesBox = document.getElementById("supportai-messages");
    const form = document.getElementById("supportai-input-area");
    const input = document.getElementById("supportai-input");
    const sendBtn = document.getElementById("supportai-send-btn");
    const chatIcon = document.getElementById("sai-chat-icon");
    const closeIcon = document.getElementById("sai-close-icon");
    const avatarBox = document.getElementById("sai-avatar-box");
    const titleEl = document.getElementById("sai-title");

    // 6. Helpers
    function toggleWidget() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add("sai-open");
            chatIcon.style.display = "none";
            closeIcon.style.display = "block";
            input.focus();
        } else {
            chatWindow.classList.remove("sai-open");
            chatIcon.style.display = "block";
            closeIcon.style.display = "none";
        }
    }

    function appendMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `sai-msg ${role === "user" ? "sai-msg-user" : "sai-msg-assistant"}`;
        msg.textContent = text;
        messagesBox.appendChild(msg);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return msg;
    }

    function showTyping() {
        const typing = document.createElement("div");
        typing.id = "sai-typing";
        typing.className = "sai-typing-indicator";
        typing.innerHTML = `<div class="sai-typing-dot"></div><div class="sai-typing-dot"></div><div class="sai-typing-dot"></div>`;
        messagesBox.appendChild(typing);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById("sai-typing");
        if (el) el.remove();
    }

    // 7. Load Organization Config
    async function loadConfig() {
        try {
            const res = await fetch(`${apiUrl}/api/v1/widget/config`, {
                headers: { "X-API-Key": apiKey },
            });
            if (!res.ok) return;
            config = await res.json();

            // Apply primary color
            if (config.primary_color) {
                document.documentElement.style.setProperty("--sai-primary", config.primary_color);
            }
            // Apply title
            if (config.widget_title) {
                titleEl.textContent = config.widget_title;
            }
            // Apply logo
            if (config.company_logo_url) {
                avatarBox.innerHTML = `<img src="${config.company_logo_url}" alt="Logo"/>`;
            } else if (config.organization_name) {
                avatarBox.textContent = config.organization_name.charAt(0).toUpperCase();
            }

            // Initial welcome message
            if (messagesBox.children.length === 0) {
                appendMessage("assistant", config.welcome_message || "Hi! How can we help?");
            }
        } catch (err) {
            console.warn("[SupportAI] Failed to load config:", err);
        }
    }

    // 8. Stream Message Submission
    async function sendMessage(question) {
        if (!question || isStreaming) return;

        appendMessage("user", question);
        input.value = "";
        isStreaming = true;
        sendBtn.disabled = true;
        showTyping();

        let assistantMsgEl = null;

        try {
            const response = await fetch(`${apiUrl}/api/v1/widget/chat/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": apiKey,
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    question: question,
                }),
            });

            hideTyping();

            if (!response.ok) {
                appendMessage("assistant", "Sorry, an error occurred while connecting. Please try again.");
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === "[DONE]") {
                            break;
                        }
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.type === "meta" && data.conversation_id) {
                                conversationId = data.conversation_id;
                                localStorage.setItem("supportai_conv_id", conversationId);
                            } else if (data.type === "token" && data.content) {
                                if (!assistantMsgEl) {
                                    assistantMsgEl = appendMessage("assistant", "");
                                }
                                assistantMsgEl.textContent += data.content;
                                messagesBox.scrollTop = messagesBox.scrollHeight;
                            }
                        } catch (e) {
                            // Ignore non-JSON chunks
                        }
                    }
                }
            }
        } catch (error) {
            hideTyping();
            appendMessage("assistant", "Could not reach the server. Please check your connection.");
        } finally {
            isStreaming = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    // 9. Event Listeners
    launcher.addEventListener("click", toggleWidget);
    closeBtn.addEventListener("click", toggleWidget);
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) sendMessage(text);
    });

    // 10. Initialize
    loadConfig();
})();
