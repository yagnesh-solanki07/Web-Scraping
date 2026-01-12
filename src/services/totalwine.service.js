const scrapeTotalWine = require("../scrapers/totalwine.scraper");

function totalWineWine() {
  const url =
    "https://www.totalwine.com/wine/c/c0020?&pageSize=100&aty=1,1,0,0";

  return scrapeTotalWine(url, "wine");
}

function totalWineSpirits() {
  const url =
    "https://www.totalwine.com/spirits/c/c0030?&pageSize=72&aty=1,1,0,0";

  return scrapeTotalWine(url, "spirits");
}

module.exports = {
  totalWineWine,
  totalWineSpirits,
};
