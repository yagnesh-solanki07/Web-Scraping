const specsService = require("../services/specsonline.service");

// Start wine scraping
function getWine(req, res) {
  specsService.specsOnlineWine()
    .catch(err => console.error("SpecsOnline wine error:", err));

  res.json({
    status: "started",
    source: "specsonline",
    type: "wine",
  });
}

// Start spirits scraping
function getSpirits(req, res) {
  specsService.specsOnlineSpirits()
    .catch(err => console.error("SpecsOnline spirits error:", err));

  res.json({
    status: "started",
    source: "specsonline",
    type: "spirits",
  });
}

module.exports = {
  getWine,
  getSpirits,
};
