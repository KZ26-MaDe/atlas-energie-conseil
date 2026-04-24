const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");
const yearTarget = document.getElementById("year");
const heroVideo = document.querySelector(".hero-video");
const heroVideoFrame = document.querySelector(".hero-video-frame");
const mediaImages = document.querySelectorAll(".media-card-image");
const legalTriggers = document.querySelectorAll("[data-legal-modal]");
const legalModals = document.querySelectorAll(".legal-modal");

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
