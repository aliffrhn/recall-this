const form = document.getElementById("upload-form");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const outputSection = document.getElementById("output");
const segmentsDetails = document.getElementById("segments");
const segmentsList = document.getElementById("segments-list");
const audioInput = document.getElementById("audio");
const languageSelect = document.getElementById("language");
const modelSelect = document.getElementById("model");
const copyButton = document.getElementById("copy-transcript");
const copyButtonLabel = copyButton?.querySelector(".ghost-label");
const modelHint = document.getElementById("model-hint");
const progressWrapper = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const summaryBlock = document.getElementById("summary-block");
const summaryListEl = document.getElementById("summary-list");
const summaryNoteEl = document.getElementById("summary-note");
const summaryTrigger = document.getElementById("generate-summary");
const summaryTriggerDefaultLabel = summaryTrigger?.textContent || "Get AI summary";
const copySummaryButton = document.getElementById("copy-summary");
const copySummaryLabel = copySummaryButton?.querySelector(".ghost-label");
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const settingsClose = document.getElementById("settings-close");
const settingsBackdrop = document.getElementById("settings-backdrop");
const apiKeyInput = document.getElementById("openai-key");
const clearKeyButton = document.getElementById("clear-key");
const keyStatusEl = document.getElementById("key-status");
const summaryHasServerKey = summaryBlock?.dataset.hasDefaultOpenai === "true";
const KEY_STORAGE_ID = "recall-openai-key";

let progressInterval = null;
const PROGRESS_MAX_BEFORE_COMPLETE = 92;
let lastTranscript = "";
let lastLanguage = null;
let summaryLoading = false;
let summaryRaw = "";

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

const getStoredApiKey = () => window.localStorage?.getItem(KEY_STORAGE_ID) || "";

const persistApiKey = (value) => {
  if (!window.localStorage) return;
  if (value) {
    window.localStorage.setItem(KEY_STORAGE_ID, value);
  } else {
    window.localStorage.removeItem(KEY_STORAGE_ID);
  }
};

const getEffectiveApiKey = () => (apiKeyInput?.value.trim() || getStoredApiKey());

const updateKeyStatus = () => {
  if (!keyStatusEl) return;
  keyStatusEl.textContent = getEffectiveApiKey()
    ? "Key saved locally for summaries."
    : "No key stored. Add one to enable AI summaries.";
};

const refreshSummaryUI = (resetNote = false) => {
  if (!summaryBlock) return;
  const hasTranscript = Boolean(lastTranscript.trim());
  summaryBlock.hidden = !hasTranscript;
  if (!hasTranscript) {
    return;
  }
  const hasKey = summaryHasServerKey || Boolean(getEffectiveApiKey());
  if (summaryTrigger && !summaryLoading) {
    summaryTrigger.disabled = !hasKey;
  }
  if (resetNote && summaryNoteEl) {
    summaryNoteEl.textContent = hasKey
      ? 'Click "Get AI summary" to generate bullet notes.'
      : 'Add your OpenAI key, then click "Get AI summary".';
  }
};

const resetSummaryState = () => {
  if (!summaryBlock) return;
  summaryRaw = "";
  if (summaryListEl) summaryListEl.innerHTML = "";
  summaryBlock.hidden = true;
  if (copySummaryButton) {
    copySummaryButton.disabled = true;
    if (copySummaryLabel) {
      copySummaryLabel.textContent = "Copy summary";
    }
  }
  summaryLoading = false;
  if (summaryTrigger) {
    summaryTrigger.textContent = summaryTriggerDefaultLabel;
  }
  refreshSummaryUI(true);
};

const toggleSettings = (open) => {
  if (!settingsPanel || !settingsBackdrop) return;
  if (open) {
    settingsPanel.hidden = false;
    settingsPanel.setAttribute("aria-hidden", "false");
    settingsBackdrop.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => apiKeyInput?.focus());
  } else {
    settingsPanel.hidden = true;
    settingsPanel.setAttribute("aria-hidden", "true");
    settingsBackdrop.hidden = true;
    document.body.classList.remove("modal-open");
  }
};

const setStatus = (message, type = "") => {
  statusEl.textContent = message;
  statusEl.className = type ? type : "";
};

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
    resetSummaryState();
    if (copyButton) {
      copyButton.disabled = !data.text;
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copy transcript";
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
    resetSummaryState();
    if (copyButton) {
      copyButton.disabled = true;
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copy transcript";
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

const handleSummary = async () => {
  if (!summaryTrigger) return;
  if (!lastTranscript.trim()) {
    setStatus("Transcribe a file before requesting a summary", "error");
    return;
  }

  if (!summaryHasServerKey && !getEffectiveApiKey()) {
    refreshSummaryUI(true);
    toggleSettings(true);
    return;
  }

  summaryLoading = true;
  summaryTrigger.disabled = true;
  summaryTrigger.textContent = "Summarizing…";
  if (summaryNoteEl) {
    summaryNoteEl.textContent = "Calling OpenAI…";
  }

  try {
    const response = await fetch("/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: lastTranscript,
        language: lastLanguage,
        openai_api_key: getEffectiveApiKey(),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to summarize transcript");
    }
    summaryRaw = data.summary || "";
    if (summaryListEl) {
      const items = summaryRaw
        .split(/\n+/)
        .map((line) => line.replace(/^[-•\s]+/, "").trim())
        .filter(Boolean);
      summaryListEl.innerHTML = "";
      if (!items.length) {
        const li = document.createElement("li");
        li.textContent = summaryRaw || "No summary returned.";
        summaryListEl.appendChild(li);
      } else {
        items.forEach((line) => {
          const li = document.createElement("li");
          li.textContent = line;
          summaryListEl.appendChild(li);
        });
      }
    }
    if (summaryBlock) {
      summaryBlock.hidden = false;
    }
    if (summaryNoteEl) {
      summaryNoteEl.textContent = data.summary_model
        ? `Powered by ${data.summary_model}`
        : "Powered by OpenAI";
    }
    if (copySummaryButton) {
      const hasSummary = Boolean(data.summary?.trim());
      copySummaryButton.disabled = !hasSummary;
      if (copySummaryLabel) {
        copySummaryLabel.textContent = "Copy summary";
      }
    }
    if (summaryTrigger) {
      summaryTrigger.textContent = "Regenerate summary";
    }
    setStatus("Summary ready", "success");
  } catch (error) {
    summaryRaw = "";
    if (summaryListEl) summaryListEl.innerHTML = "";
    if (summaryBlock) {
      summaryBlock.hidden = true;
    }
    if (copySummaryButton) {
      copySummaryButton.disabled = true;
    }
    if (summaryNoteEl) {
      summaryNoteEl.textContent = error.message;
    }
    if (summaryTrigger) {
      summaryTrigger.textContent = summaryTriggerDefaultLabel;
    }
    setStatus(error.message, "error");
  } finally {
    summaryLoading = false;
    refreshSummaryUI(false);
  }
};

summaryTrigger?.addEventListener("click", handleSummary);

if (copySummaryButton) {
  copySummaryButton.disabled = true;
  copySummaryButton.addEventListener("click", async () => {
    if (!summaryRaw.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(summaryRaw);
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

settingsToggle?.addEventListener("click", () => toggleSettings(true));
settingsClose?.addEventListener("click", () => toggleSettings(false));
settingsBackdrop?.addEventListener("click", () => toggleSettings(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsPanel && !settingsPanel.hidden) {
    toggleSettings(false);
  }
});

if (apiKeyInput) {
  const storedKey = getStoredApiKey();
  if (storedKey) {
    apiKeyInput.value = storedKey;
  }
  apiKeyInput.addEventListener("input", () => {
    const value = apiKeyInput.value.trim();
    persistApiKey(value);
    updateKeyStatus();
    refreshSummaryUI(true);
  });
}

clearKeyButton?.addEventListener("click", () => {
  if (!apiKeyInput) return;
  apiKeyInput.value = "";
  persistApiKey("");
  updateKeyStatus();
  refreshSummaryUI(true);
});

updateKeyStatus();
refreshSummaryUI(true);

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
