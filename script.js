"use strict";

/* ==========================================
   EMBER AI — FRONTEND CONTROLLER
   ========================================== */

// Replace this with your real Cloudflare Worker URL.
// Example: https://ember-ai-backend.your-subdomain.workers.dev
const WORKER_URL =
  "https://YOUR-WORKER-URL";

const CHAT_ENDPOINT = `${WORKER_URL}/chat`;

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const state = {
  listening: false,
  recognition: null,
  busy: false
};

/* ==========================================
   ELEMENTS
   ========================================== */

const sidebar = $(".sidebar");
const overlay = $(".mobile-overlay");
const chatLog = $("#chatLog");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const sendButton = $("#sendButton");
const voiceStatus = $("#voiceStatus");
const voiceOrb = $("#voiceOrb");
const kuramaStage = $(".kurama-stage");

/* ==========================================
   SAFE TEXT DISPLAY
   Use textContent, not innerHTML, for AI output.
   ========================================== */

function addMessage(text, role = "assistant", extraClass = "") {
  if (!chatLog) return null;

  const message = document.createElement("div");

  message.className =
    `message ${role}` +
    (extraClass ? ` ${extraClass}` : "");

  message.textContent = String(text);

  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;

  return message;
}

function setNotice(message, type = "") {
  const notice = $("#appNotice");
  if (!notice) return;

  notice.textContent = message;
  notice.className = `notice ${type}`;
  notice.classList.remove("hidden");
}

function clearNotice() {
  const notice = $("#appNotice");
  if (notice) {
    notice.textContent = "";
    notice.className = "notice hidden";
  }
}

/* ==========================================
   PAGE NAVIGATION
   Expected page IDs:
   homePage, chatPage, voicePage, toolsPage,
   filesPage, studyPage, codingPage, settingsPage
   ========================================== */

function showPage(pageName) {
  const page = document.getElementById(`${pageName}Page`);

  if (!page) {
    console.warn(`EMBER AI: Page not found: ${pageName}Page`);
    return;
  }

  $$(".page").forEach(item => {
    item.classList.remove("active");
  });

  page.classList.add("active");

  $$(".nav-item").forEach(button => {
    const isActive = button.dataset.page === pageName;

    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  const titles = {
    home: ["EMBER AI", "Your personal AI assistant"],
    chat: ["AI Chat", "Talk to the EMBER intelligence"],
    voice: ["Voice Assistant", "Speak where supported"],
    tools: ["Tools", "Useful assistant utilities"],
    files: ["File Analysis", "Read supported text files"],
    study: ["Study Mode", "Learn step by step"],
    coding: ["Coding Lab", "Build and understand code"],
    settings: ["Settings", "Configure your interface"]
  };

  const title = titles[pageName];

  if (title) {
    const heading = $("#pageTitle");
    const subtitle = $("#pageSubtitle");

    if (heading) heading.textContent = title[0];
    if (subtitle) subtitle.textContent = title[1];
  }

  closeMobileMenu();

  if (pageName === "chat" && chatInput) {
    setTimeout(() => chatInput.focus(), 100);
  }
}

$$("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

/* ==========================================
   MOBILE MENU
   ========================================== */

function openMobileMenu() {
  sidebar?.classList.add("open");
  overlay?.classList.add("open");
}

function closeMobileMenu() {
  sidebar?.classList.remove("open");
  overlay?.classList.remove("open");
}

$("#menuToggle")?.addEventListener("click", () => {
  if (sidebar?.classList.contains("open")) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
});

overlay?.addEventListener("click", closeMobileMenu);

/* ==========================================
   CLOCK
   ========================================== */

function updateClock() {
  const clock = $("#clock");
  if (!clock) return;

  clock.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

updateClock();
setInterval(updateClock, 1000);

/* ==========================================
   CHAT — CLOUDFLARE WORKER + GEMINI
   ========================================== */

async function askEmber(message) {
  if (state.busy) return;

  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) return;

  if (
    WORKER_URL.includes("YOUR-WORKER-URL") ||
    !WORKER_URL.startsWith("https://")
  ) {
    addMessage(
      "Setup required: open script.js and replace WORKER_URL with your actual Cloudflare Worker URL.",
      "assistant",
      "error"
    );
    return;
  }

  if (!chatLog) {
    console.error("EMBER AI: Missing #chatLog element.");
    return;
  }

  state.busy = true;

  if (sendButton) sendButton.disabled = true;

  addMessage(cleanMessage, "user");

  const typing = addMessage("EMBER is thinking...", "assistant");
  typing?.classList.add("typing-indicator");

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: cleanMessage
      })
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("The backend returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        `The server returned status ${response.status}.`
      );
    }

    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("The AI returned an empty response.");
    }

    typing?.remove();

    addMessage(data.reply, "assistant");

    // Optional voice readout, only when explicitly enabled.
    if ($("#voiceReplies")?.checked) {
      speakText(data.reply);
    }

  } catch (error) {
    typing?.remove();

    console.error("EMBER AI chat error:", error);

    addMessage(
      `I couldn't connect to my AI service. ${error.message || "Please try again."}`,
      "assistant",
      "error"
    );

  } finally {
    state.busy = false;

    if (sendButton) sendButton.disabled = false;

    chatInput?.focus();
  }
}

chatForm?.addEventListener("submit", event => {
  event.preventDefault();

  const message = chatInput?.value || "";

  if (!message.trim()) return;

  if (chatInput) chatInput.value = "";

  askEmber(message);
});

/* ==========================================
   QUICK ACTIONS
   ========================================== */

$$("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    const prompt = button.dataset.prompt;

    if (!prompt) return;

    showPage("chat");

    if (chatInput) {
      chatInput.value = prompt;
      chatInput.focus();
    }
  });
});

$("#clearChat")?.addEventListener("click", () => {
  if (!chatLog) return;

  chatLog.replaceChildren();

  addMessage(
    "Chat cleared. What would you like help with?",
    "assistant"
  );
});

/* ==========================================
   BROWSER VOICE RECOGNITION
   Requires browser support and microphone access.
   This does not provide reliable background wake-word
   detection or full Android phone control.
   ========================================== */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

function setListeningUI(active) {
  state.listening = active;

  kuramaStage?.classList.toggle("listening", active);
  voiceOrb?.classList.toggle("listening", active);

  if (voiceStatus) {
    voiceStatus.textContent = active
      ? "Listening... speak now"
      : "Microphone is not listening.";
  }

  const micButton = $("#micButton");

  if (micButton) {
    micButton.textContent = active
      ? "■ Stop Listening"
      : "🎙 Start Listening";
  }
}

function initSpeechRecognition() {
  if (!SpeechRecognition) {
    if (voiceStatus) {
      voiceStatus.textContent =
        "Speech recognition is not supported by this browser. Try a supported browser or type your message.";
    }

    const micButton = $("#micButton");
    if (micButton) micButton.disabled = true;

    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = navigator.language || "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setListeningUI(true);
  };

  recognition.onresult = event => {
    const transcript =
      event.results?.[0]?.[0]?.transcript?.trim();

    if (!transcript) return;

    if (chatInput) {
      chatInput.value = transcript;
    }

    showPage("chat");
    askEmber(transcript);
  };

  recognition.onerror = event => {
    console.warn("EMBER voice error:", event.error);

    if (voiceStatus) {
      voiceStatus.textContent =
        event.error === "not-allowed"
          ? "Microphone permission was denied."
          : `Voice error: ${event.error}`;
    }
  };

  recognition.onend = () => {
    setListeningUI(false);
  };

  state.recognition = recognition;
}

initSpeechRecognition();

function startListening() {
  if (!state.recognition) {
    if (voiceStatus) {
      voiceStatus.textContent =
        "Voice recognition is unavailable in this browser.";
    }
    return;
  }

  try {
    state.recognition.start();
  } catch (error) {
    console.warn("Could not start recognition:", error);

    if (voiceStatus) {
      voiceStatus.textContent =
        "Voice recognition is already running. Try again shortly.";
    }
  }
}

function stopListening() {
  try {
    state.recognition?.stop();
  } catch (error) {
    console.warn(error);
  }

  setListeningUI(false);
}

$("#micButton")?.addEventListener("click", () => {
  if (state.listening) {
    stopListening();
  } else {
    startListening();
  }
});

$("#heroVoiceButton")?.addEventListener("click", () => {
  showPage("voice");
  startListening();
});

/* ==========================================
   SPEECH OUTPUT
   ========================================== */

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    if (voiceStatus) {
      voiceStatus.textContent =
        "Speech output is not supported by this browser.";
    }
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(
    String(text).slice(0, 5000)
  );

  utterance.lang = navigator.language || "en-IN";
  utterance.rate = 1;
  utterance.pitch = 0.9;

  window.speechSynthesis.speak(utterance);
}

$("#stopSpeaking")?.addEventListener("click", () => {
  window.speechSynthesis?.cancel();
});

/* ==========================================
   TEXT FILE READER
   Supports plain text, TXT, JSON, CSV, JS, CSS,
   HTML, and other text-based files.
   This is not a full PDF/document parser.
   ========================================== */

$("#fileInput")?.addEventListener("change", async event => {
  const file = event.target.files?.[0];

  if (!file) return;

  const preview = $("#filePreview");

  if (file.size > 2 * 1024 * 1024) {
    if (preview) {
      preview.textContent =
        "This demo supports files up to 2 MB.";
    }
    return;
  }

  try {
    const text = await file.text();

    if (preview) {
      preview.textContent =
        `File: ${file.name}\nSize: ${file.size} bytes\n\n${text.slice(0, 30000)}`;
    }
  } catch (error) {
    if (preview) {
      preview.textContent = "Unable to read this file.";
    }
  }
});

$("#analyseFileButton")?.addEventListener("click", () => {
  const preview = $("#filePreview");

  if (!preview || !preview.textContent.trim()) {
    setNotice("Choose a text file first.", "error");
    return;
  }

  const fileContent = preview.textContent.slice(0, 7000);

  showPage("chat");

  const prompt =
    "Analyse the following file content. Summarise its main points, explain anything difficult, and identify important details:\n\n" +
    fileContent;

  if (chatInput) {
    chatInput.value = prompt;
    chatInput.focus();
  }
});

/* ==========================================
   STUDY AND CODING SHORTCUTS
   ========================================== */

$("#studyButton")?.addEventListener("click", () => {
  showPage("chat");

  if (chatInput) {
    chatInput.value =
      "Teach me this topic as a beginner. Explain it in small steps, then quiz me: ";
    chatInput.focus();
  }
});

$("#codingButton")?.addEventListener("click", () => {
  showPage("chat");

  if (chatInput) {
    chatInput.value =
      "Act as my coding tutor. Explain the solution simply, then show a complete example: ";
    chatInput.focus();
  }
});

/* ==========================================
   SETTINGS
   ========================================== */

$("#voiceReplies")?.addEventListener("change", event => {
  const enabled = event.target.checked;

  try {
    localStorage.setItem(
      "emberVoiceReplies",
      enabled ? "true" : "false"
    );
  } catch (error) {
    console.warn("Settings could not be saved.");
  }
});

try {
  const savedVoiceReplies =
    localStorage.getItem("emberVoiceReplies");

  const voiceCheckbox = $("#voiceReplies");

  if (voiceCheckbox && savedVoiceReplies !== null) {
    voiceCheckbox.checked = savedVoiceReplies === "true";
  }
} catch (error) {
  console.warn("Settings could not be loaded.");
}

/* ==========================================
   HEALTH CHECK
   ========================================== */

async function checkBackend() {
  const indicator = $("#backendStatus");

  if (!indicator) return;

  if (WORKER_URL.includes("YOUR-WORKER-URL")) {
    indicator.textContent = "Backend not configured";
    indicator.classList.remove("online");
    return;
  }

  try {
    const response = await fetch(`${WORKER_URL}/health`, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error("Health check failed");
    }

    const data = await response.json();

    indicator.textContent =
      data.status === "online"
        ? "Backend online"
        : "Backend unavailable";

    indicator.classList.toggle(
      "online",
      data.status === "online"
    );

  } catch (error) {
    indicator.textContent = "Backend unreachable";
    indicator.classList.remove("online");
  }
}

checkBackend();

/* ==========================================
   INITIALISE
   ========================================== */

if (chatLog && !chatLog.children.length) {
  addMessage(
    "Welcome to EMBER AI. I'm ready to help with your questions, coding, studying, and more. What shall we work on?",
    "assistant"
  );
}

console.log("EMBER AI frontend initialised.");
