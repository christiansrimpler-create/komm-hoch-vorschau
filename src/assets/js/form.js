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
