(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");
  const themeToggle = document.getElementById("themeToggle");
  const yearEl = document.getElementById("year");

  // Utils
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const prefersReduced = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Persisted theme
  const themeKey = "portfolio:theme";
  const applyTheme = (mode) => {
    if (mode === "light") {
      body.classList.add("light");
    } else {
      body.classList.remove("light");
    }
    try {
      localStorage.setItem(themeKey, mode);
    } catch (_) {}
  };
  const initTheme = () => {
    let stored = null;
    try {
      stored = localStorage.getItem(themeKey);
    } catch (_) {}
    if (stored) return applyTheme(stored);
    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "light" : "dark");
  };

  // Mobile nav
  const initNav = () => {
    if (!navToggle || !siteNav) return;
    const close = () => {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", () => {
      const open = siteNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    siteNav
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  };

  // Smooth scroll
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#" || targetId.length < 2) return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReduced() ? "auto" : "smooth",
          block: "start",
        });
        history.pushState(null, "", targetId);
      });
    });
  };

  // Filters (with URL sync)
  const initFilters = () => {
    const buttons = Array.from(document.querySelectorAll(".filter-btn"));
    const grid = document.getElementById("projectGrid");
    if (!buttons.length || !grid) return;

    const currentFilterFromURL = () =>
      new URLSearchParams(location.search).get("filter") || "all";
    const setActive = (key) => {
      buttons.forEach((b) =>
        b.classList.toggle("active", (b.dataset.filter || "all") === key)
      );
    };
    const applyFilter = (key) => {
      const items = Array.from(grid.querySelectorAll(".project-card"));
      items.forEach((item) => {
        const tags = (item.getAttribute("data-tags") || "").split(/\s+/);
        const show = key === "all" || tags.includes(key);
        item.style.display = show ? "" : "none";
      });
    };
    const updateURL = (key) => {
      const url = new URL(location.href);
      if (key === "all") url.searchParams.delete("filter");
      else url.searchParams.set("filter", key);
      history.replaceState(null, "", url);
    };

    const setFilter = (key) => {
      setActive(key);
      applyFilter(key);
      updateURL(key);
    };

    // Init from URL
    setFilter(currentFilterFromURL());

    buttons.forEach((btn) =>
      btn.addEventListener("click", () =>
        setFilter(btn.dataset.filter || "all")
      )
    );
  };

  // Reveal animations
  const initReveal = () => {
    if (prefersReduced()) return;
    const cards = document.querySelectorAll(".project-card");
    if (!cards.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    cards.forEach((el) => io.observe(el));
  };

  // Contact form validation
  const initForm = () => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const validators = {
      name: (v) => v.trim().length >= 2 || "Please enter your name",
      email: (v) => /.+@.+\..+/.test(v) || "Please enter a valid email",
      message: (v) =>
        v.trim().length >= 10 || "Please enter at least 10 characters",
    };

    const showError = (input, message) => {
      const small = input.parentElement.querySelector(".error");
      if (small) small.textContent = message || "";
      input.setAttribute("aria-invalid", message ? "true" : "false");
    };

    const validateField = (input) => {
      const value = input.value || "";
      const name = input.name;
      const test = validators[name];
      if (!test) return true;
      const result = test(value);
      if (result !== true) {
        showError(input, result);
        return false;
      }
      showError(input, "");
      return true;
    };

    form.addEventListener("input", (e) => {
      const target = e.target;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        validateField(target);
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = Array.from(form.querySelectorAll("input, textarea"));
      const ok = inputs.every((el) => validateField(el));
      if (!ok) return;

      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch("https://formspree.io/f/your-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed");
        alert("Thanks! I will get back to you shortly.");
        form.reset();
      } catch (err) {
        alert("Sorry, there was a problem. Please email me directly.");
      }
    });
  };

  // Theme toggle
  const initThemeToggle = () => {
    if (!themeToggle) return;
    themeToggle.addEventListener("click", () => {
      const isLight = body.classList.toggle("light");
      try {
        localStorage.setItem(themeKey, isLight ? "light" : "dark");
      } catch (_) {}
    });
  };

  // Subtle scroll header shadow
  const initHeaderShadow = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const onScroll = () => {
      const y = clamp(
        window.scrollY || document.documentElement.scrollTop,
        0,
        60
      );
      header.style.boxShadow = y > 8 ? "0 10px 30px rgba(0,0,0,0.25)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  // Init
  initTheme();
  initNav();
  initSmoothScroll();
  initFilters();
  initReveal();
  initForm();
  initThemeToggle();
  initHeaderShadow();

  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
