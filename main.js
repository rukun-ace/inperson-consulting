// InPerson Consulting, design concept.
// One scroll piece (the opening), exact landings for every link, quiet arrivals for the sections,
// and the phone menu. The same file serves the home page and the two legal pages.
(() => {
  const root = document.documentElement;
  const header = document.getElementById("header");
  const scene = document.querySelector(".scene");
  // The opening moves only for visitors who have not asked for less motion (set in the head).
  const wantsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // How far p has come between a and b, as 0 to 1.
  const span = (p, a, b) => clamp((p - a) / (b - a));

  // ---------- Where the page stands ----------

  // A reload starts at the top, or at the section named in the address. Browsers otherwise try to
  // put the page back where it was, and on a page whose opening is built from the scroll position
  // that lands somewhere else every time.
  const sectionOf = (hash) => {
    try { return hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; } catch { return null; }
  };
  const mark = (el) => {
    document.querySelectorAll(".is-target").forEach((n) => n.classList.remove("is-target"));
    if (el) el.classList.add("is-target");
  };
  // The scroll position that puts a section where it should sit under the header.
  const placeOf = (el) => {
    const want = el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
    return clamp(want, 0, root.scrollHeight - window.innerHeight);
  };
  let moved = false; // has the visitor scrolled by hand since the page opened?
  const settle = () => {
    if (moved) return;
    const el = sectionOf(location.hash);
    mark(el);
    window.scrollTo({ top: el ? placeOf(el) : 0, behavior: "instant" });
  };
  for (const type of ["wheel", "touchstart", "keydown", "mousedown"]) {
    window.addEventListener(type, () => { moved = true; }, { once: true, passive: true });
  }

  // A link to a section glides there and ends exactly on it. If the page changed height on the
  // way (a picture arriving, a panel closing), the end is corrected.
  let gliding = 0;
  const glideTo = (el) => {
    moved = true;
    mark(el);
    const run = ++gliding;
    window.scrollTo({ top: placeOf(el), behavior: wantsMotion ? "smooth" : "instant" });
    let last = -1, calm = 0;
    const watch = () => {
      if (run !== gliding) return;
      calm = Math.abs(window.scrollY - last) < 0.5 ? calm + 1 : 0;
      last = window.scrollY;
      if (calm < 8) { requestAnimationFrame(watch); return; }
      if (Math.abs(window.scrollY - placeOf(el)) > 1) window.scrollTo({ top: placeOf(el), behavior: "instant" });
    };
    requestAnimationFrame(watch);
  };
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    const el = link && sectionOf(link.getAttribute("href"));
    if (!el) return;
    event.preventDefault();
    if (location.hash !== link.getAttribute("href")) history.pushState(null, "", link.getAttribute("href"));
    glideTo(el);
    // Keyboard and screen-reader visitors continue from the section they went to.
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  });
  // A hand on the wheel or the screen takes over from a glide.
  for (const type of ["wheel", "touchstart"]) window.addEventListener(type, () => { gliding++; }, { passive: true });
  window.addEventListener("popstate", () => { moved = false; settle(); moved = true; });

  // ---------- The opening (home page only) ----------

  let animated = false;
  let refit = () => {};
  let paintScene = () => {};
  let progress = () => 0; // how far the page has scrolled through the opening, 0 to 1

  if (scene) {
    const pin = scene.querySelector(".scene__pin");
    const intro = scene.querySelector(".scene__intro");
    const lines = [...scene.querySelectorAll(".scene__quote p")];
    const caption = scene.querySelector(".scene__quote figcaption");
    const dawn = scene.querySelector(".scene__dawn");
    const sun = scene.querySelector(".mark__sun");
    const bar = scene.querySelector(".mark__bar");
    const barNavy = bar.querySelector("i");
    // The circle is drawn large and only ever scaled down, so its edge stays crisp at every size.
    const SUN = 600;
    // The logo's own proportions: the bar is 0.307 of the circle wide and 1.152 tall, its middle
    // sits 0.089 of the circle above the circle's middle, and the whole logo is 1.165 circles tall.
    const BAR_W = 0.307, BAR_H = 1.152, BAR_UP = 0.089, LOGO_H = 1.165;
    let vw = 0, vh = 0, top = 0, range = 1, d0 = 0, d1 = 0, startX = 0, startY = 0;

    const still = () => {
      for (const el of [intro, ...lines, caption, dawn, sun, bar, barNavy]) el.removeAttribute("style");
    };

    refit = () => {
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
        d0 = clamp(Math.min(vw * 0.42, (room - 96) / LOGO_H), 72, 190);
        startX = vw * 0.5;
        // A little more air above the logo than under it.
        startY = introBottom + (room - LOGO_H * d0) * 0.6 + (LOGO_H - 0.5) * d0;
      } else {
        d0 = clamp(vw * 0.24, 190, 340);
        startX = vw * 0.74;
        startY = vh * 0.53;
      }
    };

    progress = () => clamp((window.scrollY - top) / range);

    // Everything here is transform and opacity, which the browser can move without redoing the page.
    paintScene = (p) => {

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
      // It turns from the logo's grey to navy as it lands: a navy layer fading in over it.
      barNavy.style.opacity = String(span(p, 0.3, 0.5));

      // The circle goes down behind it, then rises over the new horizon as a larger sun.
      const down = ease(span(p, 0.05, 0.46));
      const up = ease(span(p, 0.54, 0.94));
      const rising = p > 0.5;
      const d = rising ? d1 : d0;
      const cx = lerp(startX, vw / 2, down);
      const cy = rising ? lerp(vh + d1 / 2 + 24, vh - d1 * 0.1, up) : lerp(startY, vh + d0 / 2 + 24, down);
      sun.style.transform = `translate3d(${cx - d / 2}px, ${cy - d / 2}px, 0) scale(${d / SUN})`;
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

    // A keyboard visitor who tabs to a button of the faded headline is taken back to where it shows.
    intro.addEventListener("focusin", () => {
      if (animated && window.scrollY - top > range * 0.02) window.scrollTo({ top, behavior: "instant" });
    });
  }

  // The opening does not follow the scroll position itself but one value that glides after it.
  // A mouse wheel moves the page in steps and a thumb in small jerks: through the glide they
  // arrive as one even movement. A finger gets a quicker glide, so the page still feels held.
  const FOLLOW = window.matchMedia("(pointer: coarse)").matches ? 0.3 : 0.16; // share of the way left, per 60 Hz frame
  let shown = 0, lastTime = 0, running = false;
  const tick = (now) => {
    const want = progress();
    const dt = lastTime ? Math.min(64, now - lastTime) : 16.7;
    lastTime = now;
    // The same glide on a 60 Hz and a 120 Hz screen.
    shown += (want - shown) * (1 - Math.pow(1 - FOLLOW, dt / 16.7));
    if (Math.abs(want - shown) < 0.0004) shown = want;
    paintScene(shown);
    if (shown !== want) requestAnimationFrame(tick);
    else { running = false; lastTime = 0; }
  };
  const follow = () => {
    header.classList.toggle("is-solid", window.scrollY > 8);
    if (animated && !running) { running = true; requestAnimationFrame(tick); }
  };
  // After a jump (a reload, a new size), the opening is simply put where the page is.
  const snap = () => {
    header.classList.toggle("is-solid", window.scrollY > 8);
    if (animated) { shown = progress(); paintScene(shown); }
  };
  // The page's measures change while it loads (letters arrive, the opening takes its place): each
  // time, the opening is measured again and the page put back where it belongs.
  const arrange = () => { refit(); settle(); snap(); };

  arrange();
  root.classList.add("scene-ready");
  window.addEventListener("scroll", follow, { passive: true });
  // A phone's address bar sliding away is a resize too, and it happens in the middle of the first
  // scroll: measuring is left until the screen has stopped changing, and skipped if only that changed.
  let resizing = 0, lastWidth = root.clientWidth, lastHeight = window.innerHeight;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizing);
    resizing = window.setTimeout(() => {
      const w = root.clientWidth, h = window.innerHeight;
      const barOnly = w === lastWidth && Math.abs(h - lastHeight) < 160;
      lastWidth = w; lastHeight = h;
      if (!barOnly) { refit(); snap(); }
    }, 160);
  });
  window.addEventListener("load", arrange);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrange);

  // ---------- Sections arrive once, as they come into view ----------

  root.classList.add("ready");
  const arrive = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      arrive.unobserve(entry.target);
    }
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-reveal]").forEach((el) => arrive.observe(el));

  // ---------- Services ----------

  // Opening a service closes the one above it, which would pull the page up from under the
  // visitor: bring the opened one back to a comfortable place. Only when the visitor opened it:
  // the browser also reports the service that is open when the page loads.
  let opened = null;
  document.querySelectorAll(".services details").forEach((item) => {
    item.querySelector("summary").addEventListener("click", () => { opened = item; });
    item.addEventListener("toggle", () => {
      if (opened !== item || !item.open) return;
      opened = null;
      const y = item.getBoundingClientRect().top;
      if (y < 88) window.scrollBy({ top: y - 104, behavior: wantsMotion ? "smooth" : "instant" });
    });
  });

  // ---------- The alliance in two numbers ----------

  // Counted from the list itself, so they can never disagree with it.
  const directory = document.querySelector(".directory");
  if (directory) {
    const put = (key, n) => { const el = document.querySelector(`[data-count="${key}"]`); if (el) el.textContent = String(n); };
    put("partners", directory.querySelectorAll("li").length);
    put("countries", directory.querySelectorAll(":scope > section").length);
  }

  // ---------- The phone menu ----------

  // A button that opens the links over the page. Escape and any link close it.
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

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
