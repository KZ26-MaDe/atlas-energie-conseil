const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");
const yearTarget = document.getElementById("year");
const heroVideo = document.querySelector(".hero-video");
const heroVideoFrame = document.querySelector(".hero-video-frame");
const mediaImages = document.querySelectorAll(".media-card-image");
const legalTriggers = document.querySelectorAll("[data-legal-modal]");
const legalModals = document.querySelectorAll(".legal-modal");
const diagnosticForm = document.querySelector("[data-diagnostic-form]");
const diagnosticQuestions = document.querySelectorAll("[data-diagnostic-question]");
const diagnosticProgress = document.querySelector("[data-diagnostic-progress]");
const diagnosticResult = document.querySelector("[data-diagnostic-result]");
const diagnosticResultTitle = document.querySelector("[data-diagnostic-result-title]");
const diagnosticResultText = document.querySelector("[data-diagnostic-result-text]");
const diagnosticReset = document.querySelector("[data-diagnostic-reset]");
const analyticsEventTargets = document.querySelectorAll("[data-analytics-event]");
const languageButtons = document.querySelectorAll("[data-language-option]");
const professionalSchema = document.getElementById("schema-professional-service");
const faqSchema = document.getElementById("schema-faq");

const DEFAULT_LANGUAGE = "fr";
const SUPPORTED_LANGUAGES = ["fr", "en", "ar", "es"];
const LANGUAGE_STORAGE_KEY = "atlas-language";

const translationCache = {};
let activeTranslations = {};
let activeLanguage = DEFAULT_LANGUAGE;
let renderDiagnosticResult = () => {};
let updateDiagnosticProgress = () => {};
let previousTextSelectors = new Set();
let previousAttrSelectors = new Set();
const originalSelectorText = new Map();
const originalSelectorAttrs = new Map();

const trackAnalyticsEvent = (eventName, params = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
};

const getNestedValue = (source, path) => {
  if (!source || !path) {
    return undefined;
  }

  return path.split(".").reduce((value, part) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    return value[part];
  }, source);
};

const formatTranslation = (value, params = {}) => {
  if (typeof value !== "string") {
    return "";
  }

  return Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value
  );
};

const translate = (path, params = {}) => {
  const value = getNestedValue(activeTranslations, path) ?? getNestedValue(translationCache[DEFAULT_LANGUAGE], path);
  return formatTranslation(value, params);
};

const safeQueryAll = (selector) => {
  try {
    return document.querySelectorAll(selector);
  } catch {
    return [];
  }
};

const getSelectorKey = (selector, index, attribute = "") => `${selector}::${index}::${attribute}`;

const rememberOriginalText = (selector, elements) => {
  elements.forEach((element, index) => {
    const key = getSelectorKey(selector, index);
    if (!originalSelectorText.has(key)) {
      originalSelectorText.set(key, element.innerHTML);
    }
  });
};

const restoreOriginalText = (selector) => {
  safeQueryAll(selector).forEach((element, index) => {
    const originalText = originalSelectorText.get(getSelectorKey(selector, index));
    if (originalText !== undefined) {
      element.innerHTML = originalText;
    }
  });
};

const rememberOriginalAttrs = (selector, elements, attributes) => {
  elements.forEach((element, index) => {
    Object.keys(attributes).forEach((attribute) => {
      const key = getSelectorKey(selector, index, attribute);
      if (!originalSelectorAttrs.has(key)) {
        originalSelectorAttrs.set(key, element.getAttribute(attribute));
      }
    });
  });
};

const restoreOriginalAttrs = (selector) => {
  safeQueryAll(selector).forEach((element, index) => {
    Array.from(originalSelectorAttrs.entries()).forEach(([key, originalValue]) => {
      const [storedSelector, storedIndex, attribute] = key.split("::");
      if (storedSelector !== selector || Number(storedIndex) !== index || !attribute) {
        return;
      }

      if (originalValue === null) {
        element.removeAttribute(attribute);
      } else {
        element.setAttribute(attribute, originalValue);
      }
    });
  });
};

const applyDataBindings = () => {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = translate(element.getAttribute("data-i18n"));
    if (value) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    const bindings = element.getAttribute("data-i18n-attr")?.split(",") ?? [];
    bindings.forEach((binding) => {
      const [attribute, path] = binding.split(":").map((part) => part.trim());
      const value = translate(path);
      if (attribute && value) {
        element.setAttribute(attribute, value);
      }
    });
  });
};

const applySelectorTranslations = () => {
  const textMap = activeTranslations.dom?.text ?? {};
  const attrMap = activeTranslations.dom?.attrs ?? {};
  const textSelectors = new Set(Object.keys(textMap));
  const attrSelectors = new Set(Object.keys(attrMap));

  previousTextSelectors.forEach((selector) => {
    if (!textSelectors.has(selector)) {
      restoreOriginalText(selector);
    }
  });

  previousAttrSelectors.forEach((selector) => {
    if (!attrSelectors.has(selector)) {
      restoreOriginalAttrs(selector);
    }
  });

  Object.entries(textMap).forEach(([selector, value]) => {
    const elements = safeQueryAll(selector);
    rememberOriginalText(selector, elements);
    elements.forEach((element) => {
      element.textContent = value;
    });
  });

  Object.entries(attrMap).forEach(([selector, attributes]) => {
    const elements = safeQueryAll(selector);
    rememberOriginalAttrs(selector, elements, attributes);
    elements.forEach((element) => {
      Object.entries(attributes).forEach(([attribute, value]) => {
        element.setAttribute(attribute, value);
      });
    });
  });

  previousTextSelectors = textSelectors;
  previousAttrSelectors = attrSelectors;
};

const applyDiagnosticTranslations = () => {
  diagnosticQuestions.forEach((question) => {
    const questionKey = question.getAttribute("data-diagnostic-question");
    const questionTranslation = getNestedValue(activeTranslations, `diagnostic.questions.${questionKey}`);

    if (!questionKey || !questionTranslation) {
      return;
    }

    const legend = question.querySelector("legend");
    if (legend) {
      legend.textContent = questionTranslation.label;
    }

    question.querySelectorAll("[data-diagnostic-option]").forEach((button) => {
      const optionKey = button.getAttribute("data-value");
      const optionLabel = questionTranslation.options?.[optionKey];
      if (optionLabel) {
        button.textContent = optionLabel;
      }
    });
  });

  updateDiagnosticProgress();
  renderDiagnosticResult();
};

const applyFaqTranslations = () => {
  const faqItems = activeTranslations.faq?.items ?? [];

  document.querySelectorAll(".faq-item").forEach((item, index) => {
    const faqItem = faqItems[index];
    if (!faqItem) {
      return;
    }

    const summary = item.querySelector("summary");
    const answer = item.querySelector("p");
    if (summary) {
      summary.textContent = faqItem.question;
    }
    if (answer) {
      answer.textContent = faqItem.answer;
    }
  });
};

const updateStructuredData = () => {
  if (professionalSchema) {
    const professionalData = {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Atlas Energie Conseil",
      url: "https://atlasenergieconseil.com/",
      email: "contact@atlasenergieconseil.com",
      description: activeTranslations.schema?.professionalDescription ?? translate("meta.description"),
      areaServed: {
        "@type": "Country",
        name: "Morocco"
      },
      sameAs: ["https://www.linkedin.com/in/khalid-zergoun-a361421a6/"]
    };

    professionalSchema.textContent = JSON.stringify(professionalData, null, 2);
  }

  if (faqSchema && activeTranslations.faq?.items) {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: activeTranslations.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    };

    faqSchema.textContent = JSON.stringify(faqData, null, 2);
  }
};

const updateLanguageControls = () => {
  languageButtons.forEach((button) => {
    const isActive = button.getAttribute("data-language-option") === activeLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
};

const applyTranslations = () => {
  const languageConfig = activeTranslations.language ?? {};
  const lang = languageConfig.code || activeLanguage;
  const direction = languageConfig.dir || (lang === "ar" ? "rtl" : "ltr");

  document.documentElement.lang = lang;
  document.documentElement.dir = direction;

  if (activeTranslations.meta?.title) {
    document.title = activeTranslations.meta.title;
  }

  applyDataBindings();
  applySelectorTranslations();
  applyDiagnosticTranslations();
  applyFaqTranslations();
  updateStructuredData();
  updateLanguageControls();
};

const loadTranslations = async (language) => {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

  if (translationCache[normalizedLanguage]) {
    return translationCache[normalizedLanguage];
  }

  const response = await fetch(`assets/i18n/${normalizedLanguage}.json`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load ${normalizedLanguage} translations`);
  }

  const translations = await response.json();
  translationCache[normalizedLanguage] = translations;
  return translations;
};

const setLanguage = async (language, { persist = true, track = false } = {}) => {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

  try {
    if (!translationCache[DEFAULT_LANGUAGE]) {
      translationCache[DEFAULT_LANGUAGE] = await loadTranslations(DEFAULT_LANGUAGE);
    }

    activeTranslations = await loadTranslations(normalizedLanguage);
    activeLanguage = normalizedLanguage;

    if (persist) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
    }

    applyTranslations();

    if (track) {
      trackAnalyticsEvent("language_switch", { language: normalizedLanguage });
    }
  } catch (error) {
    console.warn("Atlas i18n fallback:", error);
    activeTranslations = translationCache[DEFAULT_LANGUAGE] ?? {};
    activeLanguage = DEFAULT_LANGUAGE;
    applyTranslations();
  }
};

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if (navToggle && nav) {
  nav.hidden = true;

  const closeNav = () => {
    nav.classList.remove("is-open");
    nav.hidden = true;
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    nav.hidden = !isOpen;
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeNav();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav();
      navToggle.focus();
    }
  });
}

if (heroVideo) {
  const showVideo = () => {
    heroVideoFrame?.classList.add("video-ready");
    heroVideo.classList.add("is-ready");
  };

  const fallbackToPoster = () => {
    heroVideo.classList.remove("is-ready");
    heroVideoFrame?.classList.remove("video-ready");
  };

  heroVideo.addEventListener("canplay", showVideo, { once: true });
  heroVideo.addEventListener("loadeddata", showVideo, { once: true });
  heroVideo.addEventListener("error", fallbackToPoster);
  heroVideo.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  heroVideo.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
}

mediaImages.forEach((image) => {
  image.addEventListener("error", () => {
    image.closest(".media-card")?.classList.add("media-card--fallback");
  });
});

analyticsEventTargets.forEach((target) => {
  target.addEventListener("click", () => {
    const eventName = target.getAttribute("data-analytics-event");
    if (eventName) {
      trackAnalyticsEvent(eventName);
    }
  });
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const language = button.getAttribute("data-language-option");
    if (language && language !== activeLanguage) {
      setLanguage(language, { persist: true, track: true });
    }
  });
});

if (diagnosticForm && diagnosticQuestions.length > 0) {
  const answers = {};
  const totalQuestions = diagnosticQuestions.length;
  let diagnosticCompletedTracked = false;
  let currentResultKey = "";

  updateDiagnosticProgress = () => {
    const answeredCount = Object.keys(answers).length;
    if (diagnosticProgress) {
      diagnosticProgress.textContent = translate("diagnostic.progress", {
        answered: answeredCount,
        total: totalQuestions
      });
    }
    return answeredCount;
  };

  const getDiagnosticResultKey = () => {
    const uncertaintyCount = [
      answers.bill === "unknown",
      answers.bill === "confirm",
      answers.consumption === "variable",
      answers.battery === "unknown",
      answers.continuity === "clarify",
      answers.stage === "early"
    ].filter(Boolean).length;

    if (
      answers.continuity === "critical" ||
      answers.site === "sensitive" ||
      answers.objective === "backup"
    ) {
      return "backup";
    }

    if (
      answers.stage === "offers" ||
      answers.stage === "investment" ||
      answers.objective === "investment"
    ) {
      return "exchange";
    }

    if (
      answers.objective === "battery" ||
      answers.battery === "yes" ||
      answers.battery === "compare" ||
      answers.consumption === "night" ||
      answers.consumption === "continuous"
    ) {
      return "battery";
    }

    if (
      (answers.objective === "cost" || answers.objective === "solar") &&
      answers.consumption === "day" &&
      answers.battery === "no" &&
      (answers.continuity === "low" || answers.continuity === "important")
    ) {
      return "pv";
    }

    if (uncertaintyCount >= 2 || answers.stage === "early") {
      return "analysis";
    }

    return "exchange";
  };

  renderDiagnosticResult = () => {
    if (
      !currentResultKey ||
      !diagnosticResult ||
      diagnosticResult.hidden ||
      !diagnosticResultTitle ||
      !diagnosticResultText
    ) {
      return;
    }

    diagnosticResultTitle.textContent = translate(`diagnostic.results.${currentResultKey}.title`);
    diagnosticResultText.textContent = translate(`diagnostic.results.${currentResultKey}.text`);
  };

  const showDiagnosticResult = () => {
    if (!diagnosticResult || !diagnosticResultTitle || !diagnosticResultText) {
      return;
    }

    currentResultKey = getDiagnosticResultKey();
    diagnosticResult.hidden = false;
    renderDiagnosticResult();

    if (!diagnosticCompletedTracked) {
      trackAnalyticsEvent("pre_diagnostic_completed");
      diagnosticCompletedTracked = true;
    }
  };

  diagnosticQuestions.forEach((question) => {
    const questionKey = question.getAttribute("data-diagnostic-question");
    const optionButtons = question.querySelectorAll("[data-diagnostic-option]");

    optionButtons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        optionButtons.forEach((option) => {
          option.classList.remove("is-selected");
          option.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");

        if (questionKey) {
          answers[questionKey] = button.getAttribute("data-value");
        }

        const answeredCount = updateDiagnosticProgress();
        if (answeredCount === totalQuestions) {
          showDiagnosticResult();
        }
      });
    });
  });

  diagnosticReset?.addEventListener("click", () => {
    Object.keys(answers).forEach((key) => {
      delete answers[key];
    });

    diagnosticQuestions.forEach((question) => {
      question.querySelectorAll("[data-diagnostic-option]").forEach((button) => {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      });
    });

    if (diagnosticResult) {
      diagnosticResult.hidden = true;
    }

    currentResultKey = "";
    diagnosticCompletedTracked = false;
    updateDiagnosticProgress();
    diagnosticQuestions[0]?.querySelector("[data-diagnostic-option]")?.focus();
  });

  updateDiagnosticProgress();
}

if (legalTriggers.length > 0 && legalModals.length > 0) {
  let activeLegalTrigger = null;

  const closeLegalModals = (restoreFocus = true) => {
    legalModals.forEach((modal) => {
      modal.hidden = true;
    });
    document.body.style.overflow = "";
    if (restoreFocus) {
      activeLegalTrigger?.focus();
      activeLegalTrigger = null;
    }
  };

  legalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const targetId = trigger.getAttribute("data-legal-modal");
      const modal = targetId ? document.getElementById(targetId) : null;

      if (!modal) {
        return;
      }

      closeLegalModals(false);
      activeLegalTrigger = trigger;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      modal.querySelector(".legal-modal-close")?.focus();
    });
  });

  legalModals.forEach((modal) => {
    modal.querySelectorAll("[data-close-legal]").forEach((element) => {
      element.addEventListener("click", () => {
        closeLegalModals();
      });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLegalModals();
    }
  });
}

const preferredLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
setLanguage(preferredLanguage, { persist: false });
