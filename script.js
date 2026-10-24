"use strict";

/* ========================================
   EMBER AI — MAIN CONTROLLER
   Compatible with your existing index.html
   ======================================== */

// Replace with your actual Cloudflare Worker URL.
// Example: https://ember-ai-backend.your-subdomain.workers.dev
const WORKER_URL = "https://YOUR-WORKER-URL";

const $ = id => document.getElementById(id);

const state = {
  busy: false,
  recognition: null,
  listening: false
};

/* =============== CLOCK ================= */

function updateClock() {
  const clock = $("clock");
  if (!clock) return;

  clock.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

updateClock();
setInterval(updateClock, 1000);

/* ============== NAVIGATION ============= */

function showPage(page) {
  const target = $(page);
  if (!target) return;

  document.querySelectorAll(".section").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

/* ============== CHAT DISPLAY =========== */

function addMessage(text, type = "ai") {
  const element = document.createElement("div");

  element.className = `message ${type}`;
  element.textContent = String(text);

  $("chatLog")?.appendChild(element);

  const log = $("chatLog");
  if (log) log.scrollTop = log.scrollHeight;

  const copy = $("chatLogCopy");
  if (copy) {
    copy.textContent = log?.innerText || "";
  }

  return element;
}

/* ============== SPEECH OUTPUT =========== */

function speak(text) {
  const setting = $("speechToggle");

  if (setting && !setting.checked) return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(
    String(text).slice(0, 4000)
  );

  utterance.lang = "en-IN";
  utterance.rate = 1;
  utterance.pitch = 0.95;

  window.speechSynthesis.speak(utterance);
}

/* ============== GEMINI CONNECTION ====== */

async function askEmber(message) {
  const text = String(message || "").trim();

  if (!text) return;

  if (state.busy) {
    addMessage(
      "EMBER is still processing your previous request. Please wait.",
      "ai"
    );
    return;
  }

  if (
    WORKER_URL.includes("YOUR-WORKER-URL") ||
    !WORKER_URL.startsWith("https://")
  ) {
    addMessage(
      "Setup required: add your actual Cloudflare Worker URL to script.js.",
      "ai"
    );
    return;
  }

  state.busy = true;

  const sendButton = $("send");
  if (sendButton) sendButton.disabled = true;

  addMessage(text, "user");

  const loading = addMessage("EMBER is thinking...", "ai");
  loading.classList.add("loading");

  try {
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
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
        data.error || `Server error ${response.status}`
      );
    }

    if (!data.reply || typeof data.reply !== "string") {
      throw new Error("The AI returned no answer.");
    }

    loading.remove();

    addMessage(data.reply, "ai");
    speak(data.reply);

  } catch (error) {
    loading.remove();

    console.error("EMBER AI error:", error);

    addMessage(
      `I couldn't reach my AI service. ${error.message || "Please try again."}`,
      "ai"
    );

  } finally {
    state.busy = false;
    if (sendButton) sendButton.disabled = false;
  }
}

/* ============== COMMAND INPUT ========== */

function handleCommand(raw) {
  const text = String(raw || "").trim();

  if (!text) return;

  const command = text.toLowerCase();

  // Local commands: no AI request required.
  if (/^(hello|hi|hey|hello ember)[!. ]*$/.test(command)) {
    const reply =
      "Hello! EMBER is online. What would you like help with?";

    addMessage(text, "user");
    addMessage(reply, "ai");
    speak(reply);
    return;
  }

  if (
    command === "time" ||
    command === "what time is it" ||
    command === "tell me the time"
  ) {
    const reply =
      "The current time is " +
      new Date().toLocaleTimeString();

    addMessage(text, "user");
    addMessage(reply, "ai");
    speak(reply);
    return;
  }

  if (
    command === "date" ||
    command === "what is today's date" ||
    command === "what is the date"
  ) {
    const reply =
      "Today's date is " +
      new Date().toLocaleDateString();

    addMessage(text, "user");
    addMessage(reply, "ai");
    speak(reply);
    return;
  }

  if (command === "open youtube") {
    addMessage(text, "user");

    const reply = "Opening YouTube in a new browser tab.";

    addMessage(reply, "ai");
    speak(reply);

    window.open(
      "https://www.youtube.com/",
      "_blank",
      "noopener,noreferrer"
    );

    return;
  }

  if (command === "search the web") {
    addMessage(text, "user");

    const reply =
      "Tell me what you want to search for.";

    addMessage(reply, "ai");
    speak(reply);

    return;
  }

  // All other questions go to the real AI backend.
  askEmber(text);
}

function sendCommand() {
  const input = $("command");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  handleCommand(text);
}

$("send")?.addEventListener("click", sendCommand);

$("command")?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendCommand();
  }
});

/* ============== QUICK ACTIONS ========== */

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => {
    const command = button.dataset.command;
    if (!command) return;

    showPage("home");

    const input = $("command");

    if (command === "Search the web") {
      if (input) {
        input.value = "";
        input.placeholder = "What would you like to search for?";
        input.focus();
      }
      return;
    }

    handleCommand(command);
  });
});

/* ============== VOICE INPUT ============ */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

function updateVoiceStatus(message) {
  if ($("voiceStatus")) {
    $("voiceStatus").textContent = message;
  }

  if ($("voiceStatus2")) {
    $("voiceStatus2").textContent = message;
  }
}

function startListening() {
  if (!SpeechRecognition) {
    updateVoiceStatus(
      "Voice recognition isn't supported by this browser. Please type your message."
    );
    return;
  }

  if (state.listening) {
    stopListening();
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  state.recognition = recognition;

  recognition.onstart = () => {
    state.listening = true;

    $("mic")?.classList.add("listening");
    $("mic2")?.classList.add("listening");

    updateVoiceStatus("Listening... speak now.");
  };

  recognition.onresult = event => {
    const transcript =
      event.results?.[0]?.[0]?.transcript?.trim();

    if (!transcript) return;

    updateVoiceStatus(`Heard: ${transcript}`);

    showPage("home");
    handleCommand(transcript);
  };

  recognition.onerror = event => {
    updateVoiceStatus(
      event.error === "not-allowed"
        ? "Microphone permission denied."
        : `Voice error: ${event.error}`
    );
  };

  recognition.onend = () => {
    state.listening = false;

    $("mic")?.classList.remove("listening");
    $("mic2")?.classList.remove("listening");
  };

  try {
    recognition.start();
  } catch (error) {
    console.error(error);
    updateVoiceStatus("Couldn't start the microphone. Try again.");
  }
}

function stopListening() {
  try {
    state.recognition?.stop();
  } catch (_) {}

  state.listening = false;

  $("mic")?.classList.remove("listening");
  $("mic2")?.classList.remove("listening");

  updateVoiceStatus("Microphone stopped.");
}

$("mic")?.addEventListener("click", startListening);
$("mic2")?.addEventListener("click", startListening);

/* ============== FILE PREVIEW =========== */

async function previewFile(file) {
  if (!file) return;

  const preview = $("filePreview");
  if (!preview) return;

  if (file.size > 1024 * 1024) {
    preview.textContent =
      "This demo supports files up to 1 MB.";
    return;
  }

  try {
    preview.textContent = await file.text();
  } catch (error) {
    preview.textContent = "Unable to read this file.";
  }
}

$("fileInput")?.addEventListener("change", event => {
  previewFile(event.target.files?.[0]);
});

/* ============== FILE AI ANALYSIS ======= */

// Adds an analysis button dynamically, preserving your HTML.
const analyseButton = document.createElement("button");

analyseButton.className = "primary";
analyseButton.textContent = "Analyse with EMBER";
analyseButton.style.marginTop = "12px";

$("filePreview")?.parentElement?.appendChild(analyseButton);

analyseButton.addEventListener("click", () => {
  const content = $("filePreview")?.textContent?.trim();

  if (!content) {
    updateVoiceStatus("Choose a text file first.");
    return;
  }

  showPage("home");

  handleCommand(
    "Analyse this file. Summarise it, explain difficult points, " +
    "and identify important information:\n\n" +
    content.slice(0, 7000)
  );
});

/* ============== BACKEND STATUS ========== */

async function checkBackend() {
  const status = document.querySelector(".status");

  if (!status) return;

  if (WORKER_URL.includes("YOUR-WORKER-URL")) {
    status.textContent = "● BACKEND NOT CONFIGURED";
    return;
  }

  try {
    const response = await fetch(`${WORKER_URL}/health`);
    if (!response.ok) throw new Error("Health check failed");

    const data = await response.json();

    status.textContent = data.status === "online"
      ? "● BACKEND ONLINE"
      : "● BACKEND UNAVAILABLE";

  } catch (error) {
    status.textContent = "● BACKEND CONNECTION FAILED";
  }
}

checkBackend();

console.log("EMBER AI initialized.");
