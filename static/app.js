const form = document.getElementById("upload-form");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const outputSection = document.getElementById("output");
const segmentsDetails = document.getElementById("segments");
const segmentsList = document.getElementById("segments-list");
const audioInput = document.getElementById("audio");
const languageSelect = document.getElementById("language");
const modelSelect = document.getElementById("model");
const apiKeyInput = document.getElementById("openai-key");
const copyButton = document.getElementById("copy-transcript");
const copyButtonLabel = copyButton?.querySelector(".ghost-label");
const summaryBlock = document.getElementById("summary-block");
const summaryTextEl = document.getElementById("summary-text");
const summaryNoteEl = document.getElementById("summary-note");
const summaryTrigger = document.getElementById("generate-summary");
const copySummaryButton = document.getElementById("copy-summary");
const copySummaryLabel = copySummaryButton?.querySelector(".ghost-label");
const modelHint = document.getElementById("model-hint");
const progressWrapper = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const settingsClose = document.getElementById("settings-close");
const settingsBackdrop = document.getElementById("settings-backdrop");
const keyStatusEl = document.getElementById("key-status");
const clearKeyButton = document.getElementById("clear-key");

let progressInterval = null;
const PROGRESS_MAX_BEFORE_COMPLETE = 92;
let lastTranscript = "";
let lastLanguage = null;
let summaryAvailable = false;
const KEY_STORAGE_ID = "recall-openai-key";

const getStoredApiKey = () => window.localStorage.getItem(KEY_STORAGE_ID) || "";
const getEffectiveApiKey = () => (apiKeyInput?.value.trim() || getStoredApiKey());
const persistApiKey = (value) => {
  if (!value) {
    window.localStorage.removeItem(KEY_STORAGE_ID);
    return;
  }
  window.localStorage.setItem(KEY_STORAGE_ID, value);
};

const updateKeyStatus = () => {
  if (!keyStatusEl) return;
  const hasKey = Boolean(getEffectiveApiKey());
  keyStatusEl.textContent = hasKey ? "Key saved locally for summaries." : "No key stored. Add one to enable AI summaries.";
};

const clearProgressInterval = () => {
  if (progressInterval !== null) {
    window.clearInterval(progressInterval);
    progressInterval = null;
  }
};

const setProgressMessage = (message) => {
  if (progressText) {
    progressText.textContent = message;
  }
};

const startProgress = (message = "Processing audio…") => {
  if (!progressWrapper || !progressBar) return;
  clearProgressInterval();
  progressWrapper.hidden = false;
  progressBar.style.width = "0%";
  setProgressMessage(message);

  let current = 0;
  progressInterval = window.setInterval(() => {
    current = Math.min(current + Math.random() * 10, PROGRESS_MAX_BEFORE_COMPLETE);
    progressBar.style.width = `${current}%`;
  }, 450);
};

const finishProgress = (message = "Wrapping up…") => {
  if (!progressWrapper || !progressBar) return;
  setProgressMessage(message);
  clearProgressInterval();
  progressBar.style.width = "100%";
  window.setTimeout(() => {
    progressWrapper.hidden = true;
    progressBar.style.width = "0%";
  }, 650);
};

const failProgress = () => {
  if (!progressWrapper || !progressBar) return;
  clearProgressInterval();
  progressWrapper.hidden = true;
  progressBar.style.width = "0%";
};

const refreshSummaryTriggerState = () => {
  if (!summaryTrigger || !summaryBlock) return;
  const hasServerKey = summaryBlock.dataset.hasDefaultOpenai === "true";
  const usableKey = hasServerKey || Boolean(getEffectiveApiKey());
  const hasTranscript = Boolean(lastTranscript.trim());
  summaryTrigger.disabled = !(hasTranscript && usableKey);
  if (!summaryAvailable && summaryNoteEl && hasTranscript) {
    summaryNoteEl.textContent = usableKey
      ? "Click ‘Get AI summary’ to create bullet notes."
      : "Add your OpenAI key in Settings, then click ‘Get AI summary’.";
  }
};

const setStatus = (message, type = "") => {
  statusEl.textContent = message;
  statusEl.className = type ? type : "";
};

const initializeApiKeyInput = () => {
  if (!apiKeyInput) {
    updateKeyStatus();
    return;
  }
  const storedValue = getStoredApiKey();
  if (storedValue && !apiKeyInput.value) {
    apiKeyInput.value = storedValue;
  }
  apiKeyInput.addEventListener("input", () => {
    const value = apiKeyInput.value.trim();
    persistApiKey(value);
    updateKeyStatus();
    refreshSummaryTriggerState();
  });
  clearKeyButton?.addEventListener("click", () => {
    persistApiKey("");
    if (apiKeyInput) {
      apiKeyInput.value = "";
    }
    updateKeyStatus();
    refreshSummaryTriggerState();
  });
  updateKeyStatus();
};

initializeApiKeyInput();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!audioInput.files?.length) {
    setStatus("Choose an audio file first", "error");
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  setStatus("Uploading and transcribing…");

  const formData = new FormData();
  formData.append("audio", audioInput.files[0]);
  if (languageSelect) {
    formData.append("language", languageSelect.value || "auto");
  }
  if (modelSelect) {
    formData.append("model", modelSelect.value);
  }
  startProgress("Uploading audio…");

  try {
    const response = await fetch("/transcribe", {
      method: "POST",
      body: formData,
    });
    setProgressMessage("Transcribing audio…");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to transcribe file");
    }

    finishProgress("Transcription complete");
    setStatus("Transcription complete", "success");
    transcriptEl.textContent = data.text || "[No speech detected]";
    outputSection.hidden = false;
    lastTranscript = data.text || "";
    lastLanguage = data.language || null;
    summaryAvailable = false;
    if (copyButton) {
      copyButton.disabled = !data.text;
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copy transcript";
      }
    }

    if (summaryBlock) {
      summaryBlock.hidden = false;
      summaryTextEl.textContent = "";
      if (summaryNoteEl) {
        summaryNoteEl.textContent = "";
      }
      if (summaryTrigger) {
        summaryTrigger.textContent = "Get AI summary";
      }
      refreshSummaryTriggerState();
      if (copySummaryButton) {
        copySummaryButton.disabled = true;
        if (copySummaryLabel) {
          copySummaryLabel.textContent = "Copy summary";
        }
      }
    }

    if (data.segments?.length) {
      segmentsList.innerHTML = "";
      const fragment = document.createDocumentFragment();
      data.segments.forEach(({ start, end, text }) => {
        const item = document.createElement("li");
        const range = document.createElement("strong");
        range.textContent = `${start}s → ${end}s:`;
        item.append(range, " ", text);
        fragment.appendChild(item);
      });
      segmentsList.appendChild(fragment);
      segmentsDetails.hidden = false;
    } else {
      segmentsDetails.hidden = true;
      segmentsList.innerHTML = "";
    }
  } catch (error) {
    failProgress();
    setStatus(error.message, "error");
    outputSection.hidden = true;
    lastTranscript = "";
    lastLanguage = null;
    summaryAvailable = false;
    if (copyButton) {
      copyButton.disabled = true;
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copy transcript";
      }
    }
    if (summaryBlock) {
      summaryBlock.hidden = true;
      summaryTextEl.textContent = "";
      if (summaryNoteEl) {
        summaryNoteEl.textContent = "";
      }
      if (summaryTrigger) {
        summaryTrigger.disabled = true;
        summaryTrigger.textContent = "Get AI summary";
      }
      if (copySummaryButton) {
        copySummaryButton.disabled = true;
      }
    }
  } finally {
    submitButton.disabled = false;
  }
});

if (copyButton) {
  copyButton.disabled = true;
  copyButton.addEventListener("click", async () => {
    if (!transcriptEl.textContent?.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(transcriptEl.textContent);
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copied!";
      }
      copyButton.classList.add("copied");
      window.setTimeout(() => {
        copyButton.classList.remove("copied");
        if (copyButtonLabel) {
          copyButtonLabel.textContent = "Copy transcript";
        }
      }, 1500);
    } catch (error) {
      setStatus("Unable to copy transcript", "error");
    }
  });
}

if (summaryTrigger) {
  summaryTrigger.disabled = true;
  summaryTrigger.addEventListener("click", async () => {
    if (!lastTranscript.trim()) {
      setStatus("Transcribe a file before requesting a summary", "error");
      return;
    }

    summaryTrigger.disabled = true;
    summaryTrigger.textContent = "Summarizing…";
    if (summaryNoteEl) {
      summaryNoteEl.textContent = "Calling OpenAI…";
    }
    const payload = {
      text: lastTranscript,
      language: lastLanguage,
      openai_api_key: getEffectiveApiKey(),
    };

    try {
      const response = await fetch("/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize");
      }
      summaryTextEl.textContent = data.summary || "[No summary returned]";
      if (summaryNoteEl) {
        summaryNoteEl.textContent = data.summary_model
          ? `Powered by ${data.summary_model}`
          : "Powered by OpenAI";
      }
      summaryTrigger.textContent = "Regenerate summary";
      summaryAvailable = true;
      if (copySummaryButton) {
        copySummaryButton.disabled = !data.summary;
        if (copySummaryLabel) {
          copySummaryLabel.textContent = "Copy summary";
        }
      }
    } catch (error) {
      summaryTextEl.textContent = "";
      if (summaryNoteEl) {
        summaryNoteEl.textContent = error.message;
      }
      summaryTrigger.textContent = "Get AI summary";
      summaryAvailable = false;
      if (copySummaryButton) {
        copySummaryButton.disabled = true;
      }
      setStatus(error.message, "error");
    } finally {
      summaryTrigger.disabled = false;
      refreshSummaryTriggerState();
    }
  });
}

if (copySummaryButton) {
  copySummaryButton.disabled = true;
  copySummaryButton.addEventListener("click", async () => {
    if (!summaryTextEl.textContent?.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(summaryTextEl.textContent);
      if (copySummaryLabel) {
        copySummaryLabel.textContent = "Copied!";
      }
      copySummaryButton.classList.add("copied");
      window.setTimeout(() => {
        copySummaryButton.classList.remove("copied");
        if (copySummaryLabel) {
          copySummaryLabel.textContent = "Copy summary";
        }
      }, 1500);
    } catch (error) {
      setStatus("Unable to copy summary", "error");
    }
  });
}

const updateModelHint = () => {
  if (!modelSelect || !modelHint) return;
  const selectedOption = modelSelect.options[modelSelect.selectedIndex];
  const hint = selectedOption?.dataset?.hint;
  const isRecommended = selectedOption?.dataset?.recommended === "True";
  if (!hint) return;
  modelHint.textContent = isRecommended ? `${hint} · 👍 recommended` : hint;
};

if (modelSelect) {
  updateModelHint();
  modelSelect.addEventListener("change", updateModelHint);
}

const toggleSettings = (open) => {
  if (!settingsPanel || !settingsBackdrop) return;
  if (open) {
    settingsPanel.hidden = false;
    settingsPanel.setAttribute("aria-hidden", "false");
    settingsBackdrop.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => {
      apiKeyInput?.focus();
    });
  } else {
    settingsPanel.hidden = true;
    settingsPanel.setAttribute("aria-hidden", "true");
    settingsBackdrop.hidden = true;
    document.body.classList.remove("modal-open");
  }
};

settingsToggle?.addEventListener("click", () => toggleSettings(true));
settingsClose?.addEventListener("click", () => toggleSettings(false));
settingsBackdrop?.addEventListener("click", () => toggleSettings(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !settingsPanel?.hidden) {
    toggleSettings(false);
  }
});
