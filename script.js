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

if (diagnosticForm && diagnosticQuestions.length > 0) {
  const answers = {};
  const totalQuestions = diagnosticQuestions.length;
  const resultTypes = {
    analysis: {
      title: "Analyse énergétique recommandée",
      text: "Votre projet gagnerait à être cadré par une analyse énergétique indépendante avant de comparer des solutions techniques."
    },
    pv: {
      title: "Scénario PV sans batterie à étudier",
      text: "Un scénario photovoltaïque sans batterie pourrait être une première piste à étudier, notamment si votre consommation est naturellement alignée avec la production solaire."
    },
    battery: {
      title: "Scénario PV + batterie à comparer",
      text: "Un scénario PV + batterie mérite d’être comparé, à condition de vérifier les usages réels du stockage, son dimensionnement et sa cohérence économique."
    },
    backup: {
      title: "Résilience / backup à analyser",
      text: "Votre priorité semble liée à la continuité d’activité. Une analyse de résilience énergétique et de backup est recommandée avant toute décision."
    },
    exchange: {
      title: "Premier échange recommandé",
      text: "Un premier échange permettra de clarifier les hypothèses, comparer les scénarios et préparer une décision plus sécurisée."
    }
  };

  const updateProgress = () => {
    const answeredCount = Object.keys(answers).length;
    if (diagnosticProgress) {
      diagnosticProgress.textContent = `${answeredCount} / ${totalQuestions} questions complétées`;
    }
    return answeredCount;
  };

  const getDiagnosticResult = () => {
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
      return resultTypes.backup;
    }

    if (
      answers.stage === "offers" ||
      answers.stage === "investment" ||
      answers.objective === "investment"
    ) {
      return resultTypes.exchange;
    }

    if (
      answers.objective === "battery" ||
      answers.battery === "yes" ||
      answers.battery === "compare" ||
      answers.consumption === "night" ||
      answers.consumption === "continuous"
    ) {
      return resultTypes.battery;
    }

    if (
      (answers.objective === "cost" || answers.objective === "solar") &&
      answers.consumption === "day" &&
      answers.battery === "no" &&
      (answers.continuity === "low" || answers.continuity === "important")
    ) {
      return resultTypes.pv;
    }

    if (uncertaintyCount >= 2 || answers.stage === "early") {
      return resultTypes.analysis;
    }

    return resultTypes.exchange;
  };

  const showDiagnosticResult = () => {
    if (!diagnosticResult || !diagnosticResultTitle || !diagnosticResultText) {
      return;
    }

    const result = getDiagnosticResult();
    diagnosticResultTitle.textContent = result.title;
    diagnosticResultText.textContent = result.text;
    diagnosticResult.hidden = false;
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

        const answeredCount = updateProgress();
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

    updateProgress();
    diagnosticQuestions[0]?.querySelector("[data-diagnostic-option]")?.focus();
  });

  updateProgress();
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
