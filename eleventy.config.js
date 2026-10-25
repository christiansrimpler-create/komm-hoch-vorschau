import yaml from "js-yaml";

export default function (eleventyConfig) {
  // Inhalte als YAML pflegbar (Texte, Zahlen, Formularfelder)
  eleventyConfig.addDataExtension("yaml,yml", (contents) => yaml.load(contents));

  // Statische Dateien unverändert übernehmen
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  // Cache-Busting für CSS/JS
  eleventyConfig.addGlobalData("assetVersion", Date.now());

  // Vor dem Livegang: Staging darf nicht indexiert werden
  eleventyConfig.addGlobalData("erlaubeIndexierung", process.env.INDEXIERUNG === "ja");

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
