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
        const ziel = (form.querySelector('[name="ziel"]:checked') || {}).value;
        location.href = form.dataset.danke + (ziel === "betrieb" ? "?ziel=betrieb" : "");
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
      if (richtung > 0) form.classList.remove("formular--geprueft");
      schritte.forEach((fs, i) => { fs.hidden = i !== n; fs.classList.toggle("einblenden", i === n && richtung > 0); });
      balken.forEach((b, i) => b.classList.toggle("voll", i <= n));
      nr.textContent = n + 1;
      const erstes = schritte[n].querySelector("input:not([type=radio]):not([type=hidden])");
      if (erstes && richtung > 0 && matchMedia("(min-width: 60em)").matches) erstes.focus();
    };
    const gueltig = (fs) => {
      let ok = true;
      fs.querySelectorAll("input").forEach((el) => { if (!el.hidden && el.offsetParent !== null && !el.checkValidity()) { ok = false; } });
      form.classList.toggle("formular--geprueft", !ok);
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
    // Absende-Button folgt der Wahl Infopaket/Betrieb
    const senden = form.querySelector('button[type="submit"]');
    const zielFrage = form.querySelector("[data-ziel-frage]"), zielUnter = form.querySelector("[data-ziel-unter]");
    form.querySelectorAll('[name="ziel"]').forEach((r) => r.addEventListener("change", () => {
      if (!r.checked) return;
      senden.textContent = r.dataset.button;
      zielFrage.textContent = r.dataset.frage;
      zielUnter.textContent = r.dataset.unter;
    }));
    zeige(0, 0);
  });
})();

/* Chat tippt sich selbst, sobald sichtbar. Blasen reservieren ihren Platz von Anfang an. */
(function () {
  const chat = document.querySelector("[data-chat]");
  if (!chat) return;
  const blasen = [...chat.querySelectorAll(".blase")];
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { blasen.forEach((b) => b.classList.add("da")); return; }
  const tippt = document.createElement("span"); tippt.className = "tippt"; tippt.innerHTML = "<i></i><i></i><i></i>";
  let gestartet = false;
  const io = new IntersectionObserver((e) => {
    if (!e[0].isIntersecting || gestartet) return; gestartet = true; io.disconnect();
    let k = 0;
    const naechste = () => {
      if (k >= blasen.length) return;
      const b = blasen[k];
      const vonIhnen = b.classList.contains("blase--sie");
      if (vonIhnen) b.appendChild(tippt);
      setTimeout(() => {
        tippt.remove(); b.classList.add("da"); k++;
        setTimeout(naechste, 350);
      }, vonIhnen ? 450 + Math.min(b.textContent.length * 5, 600) : 300);
    };
    naechste();
  }, { threshold: 0.4 });
  io.observe(chat);
})();



/* Gehaltsbenachrichtigungen: jede Karte startet, sobald sie den mittleren Bildschirmbereich erreicht */
(function () {
  const karten = document.querySelectorAll("[data-pushs] .push, [data-pushs] .pushs__sticker");
  if (!karten.length) return;
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { karten.forEach((k) => k.classList.add("da")); return; }
  const io = new IntersectionObserver((eintraege) => {
    eintraege.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("da"); io.unobserve(e.target); } });
  }, { rootMargin: "-30% 0px -30% 0px", threshold: 0 });
  karten.forEach((k) => io.observe(k));
})();

/* Eltern-Knopf: im Formular "Elternteil" vorauswählen */
(function () {
  document.querySelectorAll("[data-abschluss]").forEach((a) => {
    a.addEventListener("click", () => {
      document.querySelectorAll('input[name="abschluss"][value="' + a.dataset.abschluss + '"]').forEach((r) => { r.checked = true; });
    });
  });
  document.querySelectorAll("[data-rolle]").forEach((a) => {
    a.addEventListener("click", () => {
      document.querySelectorAll('input[name="rolle"][value="' + a.dataset.rolle + '"]').forEach((r) => { r.checked = true; });
    });
  });
})();

// Kampagnen-Clip: kein Autoplay, Klick startet mit Ton, zweiter Klick pausiert
(function () {
  const rahmen = document.querySelector("[data-film]");
  if (!rahmen) return;
  const video = rahmen.querySelector("video");
  const ton = rahmen.querySelector(".film__ton");
  const play = rahmen.querySelector(".film__play");
  let geladen = false;
  function laden() {
    if (geladen) return;
    geladen = true;
    const klein = Math.min(window.innerWidth, window.screen.width || Infinity) < 700;
    video.src = klein ? video.dataset.srcKlein : video.dataset.srcGross;
    video.load();
  }
  function starten() {
    laden();
    video.muted = false;
    ton.setAttribute("aria-pressed", "true");
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  }
  play.addEventListener("click", starten);
  video.addEventListener("click", () => { video.paused ? starten() : video.pause(); });
  video.addEventListener("play", () => { play.hidden = true; ton.hidden = false; rahmen.classList.add("laeuft"); });
  video.addEventListener("pause", () => { play.hidden = false; });
  video.addEventListener("ended", () => { play.hidden = false; rahmen.classList.remove("laeuft"); });
  ton.addEventListener("click", () => {
    video.muted = !video.muted;
    ton.setAttribute("aria-pressed", String(!video.muted));
  });
  // Vorab nur die Metadaten holen, wenn der Clip in die Nähe scrollt
  if ("IntersectionObserver" in window) {
    const vorab = new IntersectionObserver((e) => {
      if (e.some((x) => x.isIntersecting)) { video.preload = "metadata"; laden(); vorab.disconnect(); }
    }, { rootMargin: "600px 0px" });
    vorab.observe(rahmen);
  }
})();
