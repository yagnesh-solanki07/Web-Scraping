const scrapeSpecsOnline = require("./scrapers/specsonline-products");

// specs-online-wine()
// url = specs-online-wine url
function specsOnlineWine() {
  const url =
    "https://specsonline.com/product-category/wine/?show=100";

  return scrapeSpecsOnline(url, "wine");
}

// specs-online-spirits()
// url = specs-online-spirits url
function specsOnlineSpirits() {
  const url =
    "https://specsonline.com/product-category/spirits/?show=100";

  return scrapeSpecsOnline(url, "spirits");
}

module.exports = {
  specsOnlineWine,
  specsOnlineSpirits,
};
