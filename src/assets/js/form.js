/* Lead-Formular: Validierung, Unter-16-Logik, Absenden, Quelle (UTM) */
(function () {
  const params = new URLSearchParams(location.search);
  const quelle = ["utm_source", "utm_medium", "utm_campaign", "utm_content"]
    .map((k) => params.get(k)).filter(Boolean).join(" / ") || document.referrer || "direkt";
  try { if (quelle !== "direkt") sessionStorage.setItem("quelle", quelle); } catch (e) {}
  let quelleGespeichert = quelle;
  try { quelleGespeichert = sessionStorage.getItem("quelle") || quelle; } catch (e) {}

  document.querySelectorAll("form.formular").forEach(initForm);

  function initForm(form) {
    const status = form.querySelector(".formular__status");
    const jahr = form.querySelector("[data-alter]");
    const elternFeld = form.querySelector(".feld--eltern");
    const elternMail = elternFeld.querySelector("input");
    form.querySelector('[name="quelle"]').value = quelleGespeichert;

    // Unter 16: Eltern-E-Mail einblenden und zur Pflicht machen
    jahr.addEventListener("input", () => {
      const j = parseInt(jahr.value, 10);
      const alter = new Date().getFullYear() - j;
      const unter16 = jahr.value.length === 4 && alter < 16;
      elternFeld.hidden = !unter16;
      elternMail.required = unter16;
    });

    // Fehler erst nach erstem Absendeversuch zeigen
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.classList.add("formular--geprueft");
      if (form.querySelector('[name="firma"]').value) return; // Bot
      if (!form.checkValidity()) {
        const erstes = form.querySelector(":invalid");
        erstes && erstes.focus();
        sage("Bitte prüf die rot markierten Felder.", true);
        return;
      }
      const knopf = form.querySelector('button[type="submit"]');
      knopf.disabled = true;
      const alt = knopf.textContent;
      knopf.textContent = "Wird gesendet …";
      sage("");

      try {
        const endpoint = form.dataset.endpoint;
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form),
          });
          if (!res.ok) throw new Error("HTTP " + res.status);
        } else {
          // Demo-Modus ohne Backend
          await new Promise((r) => setTimeout(r, 600));
          console.info("Demo-Modus: Formulardaten", Object.fromEntries(new FormData(form)));
        }
        location.href = form.dataset.danke;
      } catch (err) {
        knopf.disabled = false;
        knopf.textContent = alt;
        sage("Das hat nicht geklappt. Probier es gleich nochmal oder ruf an: 02973 97090", true);
      }
    });

    function sage(text, fehler) {
      status.textContent = text;
      status.classList.toggle("formular__status--fehler", !!fehler);
    }
  }
})();

/* Beträge hochzählen, sobald sie sichtbar werden */
(function () {
  const reduziert = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ziele = document.querySelectorAll("[data-zahl]");
  if (!ziele.length || reduziert || !("IntersectionObserver" in window)) return;
  const fmt = (n, el) => n.toLocaleString("de-DE") + (el.closest(".push") ? "" : " €");
  const io = new IntersectionObserver((eintraege) => {
    eintraege.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const ziel = +e.target.dataset.zahl, start = performance.now(), dauer = 1100;
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dauer), k = 1 - Math.pow(1 - p, 3);
        e.target.textContent = fmt(Math.round(ziel * k), e.target);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  ziele.forEach((z) => { z.textContent = fmt(0, z); io.observe(z); });
})();

/* Dach-Parallaxe im Hero */
(function () {
  const dach = document.querySelector(".dach");
  if (!dach || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      dach.style.setProperty("--scroll", Math.min(1, scrollY / innerHeight).toFixed(3));
      ticking = false;
    });
  }, { passive: true });
})();

/* Formular in Schritten */
(function () {
  document.querySelectorAll("form.formular").forEach((form) => {
    const schritte = [...form.querySelectorAll(".fs")];
    const balken = [...form.querySelectorAll(".fortschritt i")];
    const nr = form.querySelector("[data-schritt-nr]");
    let aktuell = 0;
    const zeige = (n, richtung) => {
      aktuell = n;
      schritte.forEach((fs, i) => { fs.hidden = i !== n; fs.classList.toggle("einblenden", i === n && richtung > 0); });
      balken.forEach((b, i) => b.classList.toggle("voll", i <= n));
      nr.textContent = n + 1;
      const erstes = schritte[n].querySelector("input:not([type=radio]):not([type=hidden])");
      if (erstes && richtung > 0 && matchMedia("(min-width: 60em)").matches) erstes.focus();
    };
    const gueltig = (fs) => {
      let ok = true;
      fs.querySelectorAll("input").forEach((el) => { if (!el.hidden && el.offsetParent !== null && !el.checkValidity()) { ok = false; } });
      form.classList.add("formular--geprueft");
      if (!ok) { const e = fs.querySelector(":invalid"); e && e.focus(); }
      return ok;
    };
    form.querySelectorAll("[data-weiter]").forEach((k) => k.addEventListener("click", () => { if (gueltig(schritte[aktuell])) zeige(aktuell + 1, 1); }));
    form.querySelectorAll("[data-zurueck]").forEach((k) => k.addEventListener("click", () => zeige(aktuell - 1, -1)));
    // Enter in Schritt 1/2 = Weiter statt Absenden
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && aktuell < schritte.length - 1 && e.target.tagName === "INPUT") { e.preventDefault(); if (gueltig(schritte[aktuell])) zeige(aktuell + 1, 1); }
    });
    // Beim Absenden alle Schritte prüfen, ggf. zurückspringen
    form.addEventListener("submit", (e) => {
      const kaputt = schritte.findIndex((fs) => [...fs.querySelectorAll("input")].some((el) => el.offsetParent !== null && !el.checkValidity()));
      if (kaputt > -1 && kaputt !== aktuell) { e.stopImmediatePropagation(); e.preventDefault(); zeige(kaputt, -1); }
    }, true);
    zeige(0, 0);
  });
})();

/* Reel: Slides laufen automatisch, Tippen links/rechts, Halten pausiert */
(function () {
  const handy = document.querySelector("[data-reel]");
  if (!handy) return;
  const slides = [...handy.querySelectorAll(".slide")];
  const balken = [...handy.querySelectorAll(".handy__balken i")];
  const dauer = 4000;
  const reduziert = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, timer = null, sichtbar = false;
  function zeige(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("aktiv", k === i));
    balken.forEach((b, k) => { b.classList.remove("laeuft", "voll"); void b.offsetWidth; if (k < i) b.classList.add("voll"); if (k === i) b.classList.add("laeuft"); });
    plan();
  }
  function plan() { clearTimeout(timer); if (sichtbar && !reduziert && !handy.hasAttribute("data-pause")) timer = setTimeout(() => zeige(i + 1), dauer); }
  handy.querySelector(".handy__tipp--links").addEventListener("click", () => zeige(i - 1));
  handy.querySelector(".handy__tipp--rechts").addEventListener("click", () => zeige(i + 1));
  ["pointerdown"].forEach((ev) => handy.addEventListener(ev, () => { handy.setAttribute("data-pause", ""); clearTimeout(timer); }));
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => handy.addEventListener(ev, () => { handy.removeAttribute("data-pause"); plan(); }));
  handy.style.setProperty("--dauer", dauer + "ms");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { sichtbar = e[0].isIntersecting; if (sichtbar) zeige(i); else clearTimeout(timer); }, { threshold: 0.5 }).observe(handy);
  } else { sichtbar = true; zeige(0); }
})();

/* Chat tippt sich selbst, sobald sichtbar */
(function () {
  const chat = document.querySelector("[data-chat]");
  if (!chat) return;
  const verlauf = chat.querySelector(".chat__verlauf");
  const blasen = [...verlauf.querySelectorAll(".blase")];
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { blasen.forEach((b) => b.classList.add("da")); return; }
  const tippt = document.createElement("p"); tippt.className = "blase blase--tippt"; tippt.innerHTML = "<i></i><i></i><i></i>";
  let gestartet = false;
  const io = new IntersectionObserver((e) => {
    if (!e[0].isIntersecting || gestartet) return; gestartet = true; io.disconnect();
    let k = 0;
    const naechste = () => {
      if (k >= blasen.length) return;
      const b = blasen[k];
      const vonIhnen = b.classList.contains("blase--sie");
      if (vonIhnen) { tippt.classList.remove("blase--ich"); verlauf.insertBefore(tippt, b); tippt.classList.add("da"); }
      setTimeout(() => {
        tippt.remove(); b.classList.add("da"); k++;
        setTimeout(naechste, 700);
      }, vonIhnen ? 900 + Math.min(b.textContent.length * 12, 1400) : 500);
    };
    naechste();
  }, { threshold: 0.4 });
  io.observe(chat);
})();

/* Dachschräge zeichnet sich, sobald sichtbar */
(function () {
  const el = document.querySelector("[data-schraege], [data-pushs]");
  if (!el) return;
  if (!("IntersectionObserver" in window)) { el.classList.add("an"); return; }
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { el.classList.add("an"); io.disconnect(); } }, { threshold: 0.4 });
  io.observe(el);
})();
