# Dachdecker werden – Lead-Landingpage

Landingpage nach Fernuni-Muster für die Dachdecker-Ausbildung in Westfalen
(Lorenz-Burmann-Schule Eslohe / Innungsverband des Dachdeckerhandwerks Westfalen).
Besucher fordern ein Infopaket an, danach Vermittlung an Innungsbetriebe.

## Entwickeln

```sh
npm install
npm run serve     # http://localhost:8080
npm run build     # Ausgabe in _site/
```

## Struktur

- `src/_data/site.yaml` – Absender, Formular-Endpoint, Domain
- `src/_data/inhalte.yaml` – alle Texte der Seite (TODO-Markierungen = Angaben von Schule/Verband nötig)
- `src/_includes/formular.njk` – Lead-Formular (zweimal eingebunden: Hero und Abschluss)
- `src/assets/js/form.js` – Validierung, Unter-16-Logik (Eltern-E-Mail), Absenden, UTM-Quelle
- `src/danke.njk` – Danke-Seite mit Double-Opt-in-Hinweis

## Formular anbinden

`site.yaml` → `formular.endpoint` auf den Endpoint des Lead-Systems setzen (z. B. Brevo-Formular
oder eigener Endpoint). Leer = Demo-Modus: Daten werden in der Browser-Konsole ausgegeben und
auf `/danke/` weitergeleitet.

## Vor dem Livegang

- Impressum und Datenschutz final (anwaltlich geprüft), Verantwortlichkeit Schule/Verband klären
- Echte Fotos und Zitate (Platzhalter sind gelb markiert)
- Consent-Banner, sobald Werbe-Tracking (Meta/TikTok-Pixel) eingebaut wird
- Build mit `INDEXIERUNG=ja npm run build`, sonst bleibt die Seite auf noindex

## Infopaket (PDF)

`broschuere/infopaket.html` ist die Druckvorlage im A5-Hochformat, `npm run broschuere` rendert sie
mit Chrome nach `broschuere/infopaket.pdf`. Fotos sind als gelbe Platzhalter markiert; echte Bilder
als `<img>` in die `.foto`-Container setzen.
