// InPerson Consulting, design concept.
// One scroll piece (the opening), quiet arrivals for the sections, and the phone menu.
(() => {
  const root = document.documentElement;
  const header = document.getElementById("header");
  const scene = document.querySelector(".scene");
  const pin = scene.querySelector(".scene__pin");
  const intro = scene.querySelector(".scene__intro");
  const lines = [...scene.querySelectorAll(".scene__quote p")];
  const caption = scene.querySelector(".scene__quote figcaption");
  const dawn = scene.querySelector(".scene__dawn");
  const sun = scene.querySelector(".mark__sun");
  const bar = scene.querySelector(".mark__bar");
  // The opening moves only for visitors who have not asked for less motion (set in the head).
  const wantsMotion = root.classList.contains("js-scene");
  let animated = wantsMotion;

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // How far p has come between a and b, as 0 to 1.
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const GREY = [102, 102, 102];
  const NAVY = [1, 43, 106];

  // The logo's own proportions: the bar is 0.307 of the circle wide and 1.152 tall, its middle
  // sits 0.089 of the circle above the circle's middle, and the whole logo is 1.165 circles tall.
  const BAR_W = 0.307, BAR_H = 1.152, BAR_UP = 0.089, LOGO_H = 1.165;

  let vw = 0, vh = 0, top = 0, range = 1, d0 = 0, d1 = 0, startX = 0, startY = 0;

  const still = () => {
    for (const el of [intro, ...lines, caption, dawn, sun, bar]) el.removeAttribute("style");
  };

  const measure = () => {
    if (!wantsMotion) return;
    // Measure in the moving layout, then check the headline block fits the screen in it.
    root.classList.add("js-scene");
    vw = root.clientWidth;
    vh = pin.clientHeight;
    const narrow = vw < 760;
    const introH = intro.offsetHeight;
    const introTop = narrow ? intro.offsetTop : (vh - introH) / 2;
    const introBottom = introTop + introH;
    // A phone on its side, or text enlarged a lot: the block is taller than the screen. A held
    // screen would cut it off, so the opening stays still there.
    animated = introTop >= 64 && introBottom <= vh - 12 && (!narrow || vh - introBottom >= 150);
    root.classList.toggle("js-scene", animated);
    if (!animated) { still(); return; }

    top = scene.offsetTop;
    range = Math.max(1, scene.offsetHeight - vh);
    d1 = narrow ? Math.min(vw * 0.78, 340) : clamp(vw * 0.36, 320, 560); // the sun that rises
    if (narrow) {
      // On a phone the logo takes the room that is left under the buttons, never touching them.
      const room = vh - introBottom;
      d0 = clamp(Math.min(vw * 0.42, (room - 76) / LOGO_H), 72, 190);
      startX = vw * 0.5;
      startY = introBottom + (room - LOGO_H * d0) / 2 + (LOGO_H - 0.5) * d0;
    } else {
      d0 = clamp(vw * 0.24, 190, 340);
      startX = vw * 0.74;
      startY = vh * 0.53;
    }
  };

  const paintScene = () => {
    const p = clamp((window.scrollY - top) / range);

    // The headline leaves.
    const out = ease(span(p, 0.02, 0.2));
    intro.style.opacity = String(1 - out);
    intro.style.transform = `translate3d(0, ${-56 * out}px, 0)`;
    // Faded out, it must not take clicks. It stays in the page for screen readers (it holds the h1).
    intro.style.pointerEvents = out > 0.5 ? "none" : "";

    // The bar tips over, falls to the foot of the screen and becomes the horizon.
    const fall = ease(span(p, 0.05, 0.5));
    const length = lerp(BAR_H * d0, vw * 1.06, fall);
    const thick = lerp(BAR_W * d0, 5, fall);
    const bx = lerp(startX, vw / 2, fall);
    const by = lerp(startY - BAR_UP * d0, vh - 2.5, fall);
    bar.style.transform = `translate3d(${bx - 50}px, ${by - 500}px, 0) rotate(${90 * fall}deg) scale(${thick / 100}, ${length / 1000})`;
    const tint = span(p, 0.3, 0.5);
    bar.style.backgroundColor = `rgb(${GREY.map((g, i) => Math.round(lerp(g, NAVY[i], tint))).join(" ")})`;

    // The circle goes down behind it, then rises over the new horizon as a larger sun.
    const down = ease(span(p, 0.05, 0.46));
    const up = ease(span(p, 0.54, 0.94));
    const rising = p > 0.5;
    const d = rising ? d1 : d0;
    const cx = lerp(startX, vw / 2, down);
    const cy = rising ? lerp(vh + d1 / 2 + 24, vh - d1 * 0.1, up) : lerp(startY, vh + d0 / 2 + 24, down);
    sun.style.transform = `translate3d(${cx - d / 2}px, ${cy - d / 2}px, 0) scale(${d / 100})`;
    // First light: the sky warms as it comes up.
    dawn.style.opacity = String(up);

    // The two lines of the quote arrive, the second with the sun.
    lines.forEach((line, i) => {
      const t = ease(span(p, 0.17 + i * 0.36, 0.37 + i * 0.36));
      line.style.opacity = String(t);
      line.style.transform = `translate3d(0, ${(1 - t) * 26}px, 0)`;
    });
    caption.style.opacity = String(ease(span(p, 0.8, 0.92)));
  };

  let queued = false;
  const frame = () => {
    queued = false;
    header.classList.toggle("is-solid", window.scrollY > 8);
    if (animated) paintScene();
  };
  const request = () => {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  };
  const refit = () => { measure(); request(); };

  // A keyboard visitor who tabs to a button of the faded headline is taken back to where it shows.
  intro.addEventListener("focusin", () => {
    if (animated && window.scrollY - top > range * 0.02) window.scrollTo({ top, behavior: "instant" });
  });

  measure();
  frame();
  root.classList.add("scene-ready");
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", refit);
  window.addEventListener("load", refit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

  // Sections arrive once, as they come into view.
  root.classList.add("ready");
  const arrive = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      arrive.unobserve(entry.target);
    }
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-reveal]").forEach((el) => arrive.observe(el));

  // Opening a service closes the one above it, which would pull the page up from under the
  // visitor: bring the opened one back to a comfortable place.
  document.querySelectorAll(".services details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      const y = item.getBoundingClientRect().top;
      if (y < 88) window.scrollBy({ top: y - 104, behavior: wantsMotion ? "smooth" : "instant" });
    });
  });

  // The alliance in two numbers, counted from the list itself so they can never disagree with it.
  const directory = document.querySelector(".directory");
  if (directory) {
    const put = (key, n) => { const el = document.querySelector(`[data-count="${key}"]`); if (el) el.textContent = String(n); };
    put("partners", directory.querySelectorAll("li").length);
    put("countries", directory.querySelectorAll(":scope > section").length);
  }

  // The phone menu: a button that opens the links over the page. Escape and any link close it.
  const menuButton = document.querySelector(".menu-button");
  const nav = document.getElementById("site-nav");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = open ? "Close" : "Menu";
  };
  menuButton.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuButton.focus(); }
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
