/* =========================================================
   عالم الدراسة — AI DEVELOPER CHAT
   n8n Production Webhook
   ========================================================= */

(() => {
  "use strict";

  // =========================================================
  // n8n PRODUCTION WEBHOOK
  // =========================================================

  const N8N_WEBHOOK_URL =
    "https://jane-loy.app.n8n.cloud/webhook/5e5a2910-d731-49b4-9217-c70938ca749c";


  // =========================================================
  // SUPABASE CONFIG
  // =========================================================

  const SUPABASE_URL =
    window.SUPABASE_URL ||
    window.QUESTION_ARCHIVE_CONFIG?.SUPABASE_URL ||
    "";

  const SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY ||
    window.QUESTION_ARCHIVE_CONFIG?.SUPABASE_ANON_KEY ||
    "";

  if (!window.supabase) {
    console.error("Supabase library is not loaded.");
    return;
  }

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


  // =========================================================
  // DOM
  // =========================================================

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const chatMessages = $("#chatMessages");
  const messageInput = $("#messageInput");
  const sendButton = $("#sendButton");
  const stopButton = $("#stopButton");
  const newChatButton = $("#newChatButton");
  const connectionStatus = $("#connectionStatus");
  const typingIndicator = $("#typingIndicator");
  const languageSelect = $("#languageSelect");
  const modeSelect = $("#modeSelect");

  let abortController = null;
  let isSending = false;

  let conversationHistory = [];


  // =========================================================
  // HELPERS
  // =========================================================

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function setConnection(text, state = "") {
    if (!connectionStatus) return;

    connectionStatus.textContent = text;
    connectionStatus.dataset.state = state;
  }


  function setTyping(show) {
    if (!typingIndicator) return;

    typingIndicator.classList.toggle("hidden", !show);
  }


  function setSendingState(sending) {
    isSending = sending;

    if (sendButton) {
      sendButton.disabled = sending;
      sendButton.classList.toggle("hidden", sending);
    }

    if (stopButton) {
      stopButton.disabled = !sending;
      stopButton.classList.toggle("hidden", !sending);
    }

    if (messageInput) {
      messageInput.disabled = sending;
    }
  }


  function scrollToBottom() {
    if (!chatMessages) return;

    requestAnimationFrame(() => {
      chatMessages.scrollTop =
        chatMessages.scrollHeight;
    });
  }


  // =========================================================
  // FORMAT AI RESPONSE
  // =========================================================

  function formatAssistantText(text) {
    let source = String(text ?? "").trim();

    if (!source) {
      return "<p>لم يصل رد من الـ AI.</p>";
    }

    const blocks = [];
    const token = "__QA_CODE_BLOCK_";

    source = source.replace(
      /```([\w#+.-]*)\s*\n?([\s\S]*?)```/g,
      (_, language, code) => {
        const index = blocks.length;

        blocks.push({
          language: language || "code",
          code: code.replace(/\n$/, "")
        });

        return `\n${token}${index}__\n`;
      }
    );

    let html = escapeHTML(source);

    html = html.replace(
      /`([^`\n]+)`/g,
      "<code>$1</code>"
    );

    html = html.replace(
      /\*\*(.+?)\*\*/g,
      "<strong>$1</strong>"
    );

    html = html.replace(
      /^### (.+)$/gm,
      "<h4>$1</h4>"
    );

    html = html.replace(
      /^## (.+)$/gm,
      "<h3>$1</h3>"
    );

    html = html.replace(
      /^# (.+)$/gm,
      "<h2>$1</h2>"
    );

    html = html.replace(
      /^\s*[-*]\s+(.+)$/gm,
      "<li>$1</li>"
    );

    html = html.replace(
      /(<li>[\s\S]*?<\/li>)/g,
      "<ul>$1</ul>"
    );

    html = html.replace(/\n/g, "<br>");

    blocks.forEach((block, index) => {
      const safeCode = escapeHTML(block.code);

      const codeHTML = `
        <div class="qa-code-block">

          <div class="qa-code-header">
            <span>${escapeHTML(block.language)}</span>

            <button
              type="button"
              class="qa-copy-code"
              data-code="${escapeHTML(block.code)}"
            >
              نسخ الكود
            </button>
          </div>

          <pre><code>${safeCode}</code></pre>

        </div>
      `;

      html = html.replace(
        new RegExp(
          token + index + "__",
          "g"
        ),
        codeHTML
      );
    });

    return html;
  }


  // =========================================================
  // ADD USER MESSAGE
  // =========================================================

  function addUserMessage(text) {
    if (!chatMessages) return;

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "chat-message user-message";

    wrapper.innerHTML = `
      <div class="message-content">

        <div class="message-label">
          أنت
        </div>

        <div class="message-body">
          ${escapeHTML(text)}
        </div>

      </div>
    `;

    chatMessages.appendChild(wrapper);

    scrollToBottom();
  }


  // =========================================================
  // ADD AI MESSAGE
  // =========================================================

  function addAssistantMessage(text) {
    if (!chatMessages) return null;

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "chat-message assistant-message";

    wrapper.innerHTML = `
      <div class="message-content">

        <div class="message-label">
          AI DEVELOPER
        </div>

        <div class="message-body assistant-body">
          ${formatAssistantText(text)}
        </div>

      </div>
    `;

    chatMessages.appendChild(wrapper);

    scrollToBottom();

    return wrapper;
  }


  // =========================================================
  // ERROR MESSAGE
  // =========================================================

  function addErrorMessage(text) {
    if (!chatMessages) return;

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "chat-message error-message";

    wrapper.innerHTML = `
      <div class="message-content">

        <div class="message-label">
          خطأ
        </div>

        <div class="message-body">
          ${escapeHTML(text)}
        </div>

      </div>
    `;

    chatMessages.appendChild(wrapper);

    scrollToBottom();
  }


  // =========================================================
  // ADMIN SESSION
  // =========================================================

  async function getAdminSession() {

    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session) {
      return null;
    }

    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select(
        "id, role, display_name"
      )
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (
      !profile ||
      profile.role !== "admin"
    ) {
      return null;
    }

    return {
      session,
      profile
    };
  }


  // =========================================================
  // ADMIN ACCESS
  // =========================================================

  async function checkAdminAccess() {

    try {

      setConnection(
        "جاري التحقق...",
        "checking"
      );

      const admin =
        await getAdminSession();

      if (!admin) {

        setConnection(
          "غير مصرح",
          "error"
        );

        setTimeout(() => {
          window.location.href =
            "admin.html";
        }, 800);

        return false;
      }

      setConnection(
        "متصل",
        "online"
      );

      return true;

    } catch (error) {

      console.error(
        "Admin check error:",
        error
      );

      setConnection(
        "خطأ في الاتصال",
        "error"
      );

      addErrorMessage(
        "حصلت مشكلة أثناء التحقق من حساب الأدمن. راجع Supabase و config.js."
      );

      return false;
    }
  }


  // =========================================================
  // LANGUAGE
  // =========================================================

  function getSelectedLanguage() {

    if (!languageSelect) {
      return "ar";
    }

    return (
      languageSelect.value ||
      "ar"
    );
  }


  // =========================================================
  // MODE
  // =========================================================

  function getSelectedMode() {

    if (!modeSelect) {
      return "developer";
    }

    return (
      modeSelect.value ||
      "developer"
    );
  }


  // =========================================================
  // BUILD n8n PAYLOAD
  // =========================================================

  function buildPayload(message) {

    return {

      message,

      history:
        conversationHistory.slice(-20),

      language:
        getSelectedLanguage(),

      mode:
        getSelectedMode(),

      source:
        "question-archive",

      client: {

        page:
          window.location.href,

        timestamp:
          new Date().toISOString()
      }
    };
  }


  // =========================================================
  // SEND TO n8n
  // =========================================================

  async function sendToN8N(message) {

    if (!N8N_WEBHOOK_URL) {
      throw new Error(
        "n8n Webhook URL is missing."
      );
    }

    abortController =
      new AbortController();

    const response =
      await fetch(
        N8N_WEBHOOK_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "application/json"
          },

          body:
            JSON.stringify(
              buildPayload(message)
            ),

          signal:
            abortController.signal
        }
      );

    if (!response.ok) {

      let details = "";

      try {
        details =
          await response.text();
      } catch (_) {}

      throw new Error(
        `n8n Error ${response.status}${
          details
            ? `: ${details.slice(0, 500)}`
            : ""
        }`
      );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      return await response.json();
    }

    const text =
      await response.text();

    return {
      reply: text
    };
  }


  // =========================================================
  // EXTRACT RESPONSE
  // =========================================================

  function extractReply(data) {

    if (data == null) {
      return "";
    }

    if (
      typeof data === "string"
    ) {
      return data;
    }

    const keys = [
      "reply",
      "output",
      "text",
      "response",
      "answer",
      "message"
    ];

    for (const key of keys) {

      if (
        typeof data[key] ===
          "string" &&
        data[key].trim()
      ) {

        return data[key].trim();
      }
    }

    if (data.data) {

      const nested =
        extractReply(data.data);

      if (nested) {
        return nested;
      }
    }

    if (
      Array.isArray(data) &&
      data.length
    ) {

      for (const item of data) {

        const nested =
          extractReply(item);

        if (nested) {
          return nested;
        }
      }
    }

    try {

      return JSON.stringify(
        data,
        null,
        2
      );

    } catch (_) {

      return String(data);
    }
  }


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  async function handleSend() {

    if (isSending) return;

    const message =
      messageInput?.value?.trim() ||
      "";

    if (!message) return;

    addUserMessage(message);

    if (messageInput) {

      messageInput.value = "";

      messageInput.style.height =
        "";
    }

    conversationHistory.push({
      role: "user",
      content: message
    });

    setSendingState(true);

    setTyping(true);

    try {

      const data =
        await sendToN8N(message);

      const reply =
        extractReply(data);

      if (!reply) {

        throw new Error(
          "n8n returned an empty AI response."
        );
      }

      addAssistantMessage(
        reply
      );

      conversationHistory.push({
        role: "assistant",
        content: reply
      });

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {

        addAssistantMessage(
          "تم إيقاف التوليد."
        );

      } else {

        console.error(
          "AI chat error:",
          error
        );

        addErrorMessage(
          `تعذر الحصول على رد من AI.

${error.message || error}`
        );
      }

    } finally {

      abortController = null;

      setTyping(false);

      setSendingState(false);

      if (messageInput) {
        messageInput.focus();
      }
    }
  }


  // =========================================================
  // STOP
  // =========================================================

  function stopGeneration() {

    if (abortController) {
      abortController.abort();
    }
  }


  // =========================================================
  // NEW CHAT
  // =========================================================

  function startNewChat() {

    conversationHistory = [];

    if (chatMessages) {

      chatMessages.innerHTML = `

        <div class="chat-message assistant-message">

          <div class="message-content">

            <div class="message-label">
              AI DEVELOPER
            </div>

            <div class="message-body">

              <h2>
                أهلاً بيك في AI Developer
              </h2>

              <p>
                أنا مساعد البرمجة الخاص بالمشروع.
                ابعتلي الكود أو المشكلة، وهساعدك في
                HTML و CSS و JavaScript و TypeScript
                و Python و SQL و Supabase و APIs و n8n.
              </p>

            </div>

          </div>

        </div>

      `;
    }

    if (messageInput) {

      messageInput.value = "";

      messageInput.focus();
    }

    setConnection(
      "متصل",
      "online"
    );

    scrollToBottom();
  }


  // =========================================================
  // COPY CODE
  // =========================================================

  async function copyCode(code) {

    try {

      await navigator.clipboard.writeText(
        code
      );

      return true;

    } catch (error) {

      console.error(
        "Copy error:",
        error
      );

      return false;
    }
  }


  document.addEventListener(
    "click",
    async (event) => {

      const button =
        event.target.closest(
          ".qa-copy-code"
        );

      if (!button) return;

      const code =
        button.getAttribute(
          "data-code"
        ) || "";

      const success =
        await copyCode(
          code
            .replace(
              /&quot;/g,
              '"'
            )
            .replace(
              /&#039;/g,
              "'"
            )
            .replace(
              /&lt;/g,
              "<"
            )
            .replace(
              /&gt;/g,
              ">"
            )
            .replace(
              /&amp;/g,
              "&"
            )
        );

      if (success) {

        const original =
          button.textContent;

        button.textContent =
          "تم النسخ";

        setTimeout(() => {

          button.textContent =
            original;

        }, 1200);
      }
    }
  );


  // =========================================================
  // QUICK PROMPTS
  // =========================================================

  function fillPrompt(text) {

    if (!messageInput) return;

    messageInput.value = text;

    messageInput.focus();

    messageInput.style.height =
      "auto";

    messageInput.style.height =
      `${messageInput.scrollHeight}px`;
  }


  document.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-ai-prompt], [data-prompt]"
        );

      if (!button) return;

      const prompt =
        button.dataset.aiPrompt ||
        button.dataset.prompt ||
        "";

      if (prompt) {
        fillPrompt(prompt);
      }
    }
  );


  // =========================================================
  // TEXTAREA
  // =========================================================

  if (messageInput) {

    messageInput.addEventListener(
      "input",
      () => {

        messageInput.style.height =
          "auto";

        messageInput.style.height =
          `${Math.min(
            messageInput.scrollHeight,
            220
          )}px`;
      }
    );


    messageInput.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          handleSend();
        }
      }
    );
  }


  // =========================================================
  // BUTTONS
  // =========================================================

  if (sendButton) {

    sendButton.addEventListener(
      "click",
      handleSend
    );
  }


  if (stopButton) {

    stopButton.addEventListener(
      "click",
      stopGeneration
    );
  }


  if (newChatButton) {

    newChatButton.addEventListener(
      "click",
      startNewChat
    );
  }


  // =========================================================
  // SUPABASE AUTH
  // =========================================================

  supabaseClient.auth.onAuthStateChange(
    async (_event, session) => {

      if (!session) {

        setConnection(
          "غير مسجل",
          "error"
        );

        return;
      }
    }
  );


  // =========================================================
  // INIT
  // =========================================================

  async function init() {

    if (
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY
    ) {

      setConnection(
        "إعدادات Supabase ناقصة",
        "error"
      );

      addErrorMessage(
        "راجع config.js وتأكد من SUPABASE_URL و SUPABASE_ANON_KEY."
      );

      return;
    }

    const allowed =
      await checkAdminAccess();

    if (!allowed) {
      return;
    }

    setConnection(
      "متصل بـ عالم الدراسة",
      "online"
    );

    scrollToBottom();
  }


  init();


  // =========================================================
  // OPTIONAL GLOBAL API
  // =========================================================

  window.QuestionArchiveAI = {

    send:
      handleSend,

    stop:
      stopGeneration,

    newChat:
      startNewChat,

    getHistory:
      () => [...conversationHistory],

    getWebhookURL:
      () => N8N_WEBHOOK_URL

  };

})();
