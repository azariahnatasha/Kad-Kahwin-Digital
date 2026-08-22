// Ceremony time is fixed to Malaysia time (UTC+8), regardless of the guest's timezone.
const ceremonyTime = new Date("2026-09-19T10:00:00+08:00").getTime();
const countdownValues = {
  days: document.querySelector('[data-countdown="days"]'),
  hours: document.querySelector('[data-countdown="hours"]'),
  minutes: document.querySelector('[data-countdown="minutes"]'),
};
const countdownMessage = document.querySelector(".countdown-message");
const rsvpOpen = document.querySelector(".rsvp-open");
const rsvpOverlay = document.querySelector(".rsvp-overlay");
const rsvpClose = document.querySelector(".rsvp-close");
const rsvpForm = document.querySelector(".rsvp-form");
const guestCountField = document.querySelector(".guest-count-field");
const rsvpSubmit = document.querySelector(".rsvp-submit");
const rsvpNote = document.querySelector(".rsvp-note");
const rsvpEndpoint = "https://script.google.com/macros/s/AKfycbztKD3mbs9RtA3WiJxbAJRROnFcLJxfvnflkWKvkhqOkhqQ0VW3v3YqY_B5rYA818006g/exec";
const invitation = document.querySelector(".invitation");
const openingPage = document.querySelector(".opening-page");
const invitationOpen = document.querySelector(".invitation-open");
const weddingMusic = document.querySelector("#wedding-music");
const musicToggle = document.querySelector(".music-toggle");
const invitationPages = [...document.querySelectorAll(".invitation-page")];
const scrollControls = document.querySelector(".scroll-controls");
const scrollUp = document.querySelector(".scroll-control--up");
const scrollDown = document.querySelector(".scroll-control--down");

const currentPageIndex = () => Math.round(invitation.scrollTop / invitation.clientHeight);

const updateScrollControls = () => {
  const pageIndex = currentPageIndex();
  scrollUp.hidden = pageIndex <= 0;
  scrollDown.hidden = pageIndex >= invitationPages.length - 1;
};

const scrollToPage = (pageIndex) => {
  const safeIndex = Math.max(0, Math.min(invitationPages.length - 1, pageIndex));
  invitation.scrollTo({
    top: safeIndex * invitation.clientHeight,
    behavior: "smooth",
  });
};

scrollUp.addEventListener("click", () => scrollToPage(currentPageIndex() - 1));
scrollDown.addEventListener("click", () => scrollToPage(currentPageIndex() + 1));
invitation.addEventListener("scroll", updateScrollControls, { passive: true });
window.addEventListener("resize", updateScrollControls);
updateScrollControls();

invitationOpen.addEventListener("click", () => {
  removeFirstInteractionListeners();
  playMusic();
  invitation.scrollTop = 0;
  invitation.classList.remove("is-locked");
  openingPage.classList.add("is-opening");

  window.setTimeout(() => {
    openingPage.hidden = true;
  }, 850);
});

weddingMusic.volume = 0.28;

const updateMusicControl = () => {
  const isPlaying = !weddingMusic.paused;
  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", isPlaying ? "Hentikan muzik" : "Mainkan muzik");
};

const playMusic = () => {
  const playAttempt = weddingMusic.play();
  if (playAttempt) {
    playAttempt.catch(() => updateMusicControl());
  }
};

const removeFirstInteractionListeners = () => {
  document.removeEventListener("pointerdown", startMusicOnFirstInteraction);
  document.removeEventListener("keydown", startMusicOnFirstInteraction);
};

const startMusicOnFirstInteraction = (event) => {
  if (event.target.closest?.(".music-toggle")) return;
  playMusic();
  removeFirstInteractionListeners();
};

document.addEventListener("pointerdown", startMusicOnFirstInteraction, { passive: true });
document.addEventListener("keydown", startMusicOnFirstInteraction);

musicToggle.addEventListener("click", () => {
  removeFirstInteractionListeners();
  if (weddingMusic.paused) playMusic();
  else weddingMusic.pause();
});

weddingMusic.addEventListener("play", updateMusicControl);
weddingMusic.addEventListener("pause", updateMusicControl);
updateMusicControl();

const pageRevealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, {
  root: invitation,
  threshold: 0.45,
});

document.querySelectorAll(".page-two, .page-three").forEach((page) => {
  pageRevealObserver.observe(page);
});

const updateCountdown = () => {
  const remaining = Math.max(0, ceremonyTime - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  countdownValues.days.textContent = String(days).padStart(2, "0");
  countdownValues.hours.textContent = String(hours).padStart(2, "0");
  countdownValues.minutes.textContent = String(minutes).padStart(2, "0");

  if (remaining === 0) {
    countdownMessage.textContent = "Hari yang dinantikan telah tiba";
  }
};

updateCountdown();
setInterval(updateCountdown, 1000);

const openRsvp = () => {
  rsvpOverlay.hidden = false;
  scrollControls.hidden = true;
  musicToggle.hidden = true;
  rsvpOpen.setAttribute("aria-expanded", "true");
  rsvpForm.querySelector("input").focus();
};

const closeRsvp = () => {
  rsvpOverlay.hidden = true;
  scrollControls.hidden = false;
  musicToggle.hidden = false;
  updateScrollControls();
  rsvpOpen.setAttribute("aria-expanded", "false");
  if (rsvpNote.classList.contains("is-success")) {
    rsvpSubmit.disabled = false;
    rsvpSubmit.textContent = "Hantar RSVP";
    rsvpNote.classList.remove("is-success");
    rsvpNote.textContent = "Jawapan akan direkodkan dalam senarai tetamu";
  }
  rsvpOpen.focus();
};

rsvpOpen.addEventListener("click", (event) => {
  event.stopPropagation();
  openRsvp();
});

rsvpClose.addEventListener("click", (event) => {
  event.stopPropagation();
  closeRsvp();
});

rsvpOverlay.addEventListener("click", (event) => {
  event.stopPropagation();
  if (event.target === rsvpOverlay) closeRsvp();
});

rsvpForm.addEventListener("change", () => {
  const attendance = rsvpForm.elements.attendance.value;
  guestCountField.hidden = attendance === "Tidak Hadir";
});

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(rsvpForm);
  const attendance = data.get("attendance");
  const response = new URLSearchParams({
    guestName: data.get("guestName"),
    attendance,
    guestCount: attendance === "Hadir" ? data.get("guestCount") : "0",
  });

  rsvpSubmit.disabled = true;
  rsvpSubmit.textContent = "Menghantar...";
  rsvpNote.classList.remove("is-success", "is-error");
  rsvpNote.textContent = "Sila tunggu sebentar";

  try {
    await fetch(rsvpEndpoint, {
      method: "POST",
      mode: "no-cors",
      body: response,
    });

    rsvpForm.reset();
    guestCountField.hidden = false;
    rsvpNote.classList.add("is-success");
    rsvpNote.textContent = "Terima kasih. Kehadiran anda telah direkodkan.";
    rsvpSubmit.textContent = "RSVP Dihantar";
    window.setTimeout(closeRsvp, 1600);
  } catch (error) {
    rsvpNote.classList.add("is-error");
    rsvpNote.textContent = "RSVP tidak dapat dihantar. Sila cuba lagi.";
    rsvpSubmit.disabled = false;
    rsvpSubmit.textContent = "Hantar RSVP";
  }
});

// Decorative petals shared by all invitation pages.
const petalCount = 16;

document.querySelectorAll(".petal-layer").forEach((layer) => {
  for (let index = 0; index < petalCount; index += 1) {
    const petal = document.createElement("span");
    const startX = Math.random() * 100;
    const sway = 8 + Math.random() * 18;
    const direction = Math.random() > 0.5 ? 1 : -1;

    petal.className = "petal";
    petal.style.setProperty("--petal-size", `${7 + Math.random() * 8}px`);
    petal.style.setProperty("--petal-opacity", `${0.32 + Math.random() * 0.32}`);
    petal.style.setProperty("--fall-duration", `${10 + Math.random() * 8}s`);
    petal.style.setProperty("--fall-delay", `${-Math.random() * 16}s`);
    petal.style.setProperty("--start-x", `${startX}vw`);
    petal.style.setProperty("--middle-x", `${startX + sway * direction}vw`);
    petal.style.setProperty("--end-x", `${startX - sway * direction * 0.45}vw`);
    layer.append(petal);
  }
});

// Close the RSVP panel with Escape.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (!rsvpOverlay.hidden) {
    event.preventDefault();
    closeRsvp();
  }
});
