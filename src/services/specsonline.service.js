const scrapeSpecsOnline = require("../scrapers/specsonline.scraper");

function specsOnlineWine() {
  const url =
    "https://specsonline.com/product-category/wine/?show=100";

  return scrapeSpecsOnline(url, "wine");
}

function specsOnlineSpirits() {
  const url =
    "https://specsonline.com/product-category/spirits/?show=100";

  return scrapeSpecsOnline(url, "spirits");
}

module.exports = {
  specsOnlineWine,
  specsOnlineSpirits,
};
