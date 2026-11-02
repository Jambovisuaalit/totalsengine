"use strict";
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const setOpen = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 780) setOpen(false);
    }, { passive: true });
  }

  // Narrow scroll progress indicator; requestAnimationFrame keeps updates
  // off the hot scroll event path.
  const progress = document.createElement("div");
  progress.className = "te-scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);
  let frameRequested = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    progress.style.transform = "scaleX(" + fraction.toFixed(4) + ")";
    frameRequested = false;
  };
  const requestProgress = () => {
    if (!frameRequested) {
      frameRequested = true;
      window.requestAnimationFrame(updateProgress);
    }
  };
  updateProgress();
  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });

  const header = document.querySelector(".header");
  const handleScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealSelectors = [
    ".section-heading",
    ".feature-tiles > .tile",
    ".product-copy",
    ".product-art",
    ".proof-dashboard",
    ".pricing-copy",
    ".price-card",
    ".faq-heading",
    ".accordion",
    ".cta-inner > h2",
    ".footer-main"
  ];
  if (!reducedMotion && "IntersectionObserver" in window) {
    const revealNodes = document.querySelectorAll(revealSelectors.join(","));
    // Elements already visible are shown immediately so a first paint never
    // flashes an empty hero or blank panels.
    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -35px 0px", threshold: 0.09 });
    for (const node of revealNodes) {
      node.setAttribute("data-reveal", "");
      if (node.getBoundingClientRect().top < window.innerHeight * 0.9) {
        node.classList.add("is-visible");
      } else {
        observer.observe(node);
      }
    }
    document.documentElement.classList.add("motion-ready");
  }

  // Highlight current section in primary navigation; keep scrolling passive.
  if ("IntersectionObserver" in window) {
    const anchors = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
    const sections = anchors.map((anchor) => {
      const id = anchor.getAttribute("href")?.slice(1);
      return id ? document.getElementById(id) : null;
    }).filter(Boolean);
    const navObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of anchors) {
          if (link.getAttribute("href") === "#" + entry.target.id) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        }
      }
    }, { rootMargin: "-24% 0px -58% 0px", threshold: 0 });
    for (const section of sections) navObserver.observe(section);
  }
})();
