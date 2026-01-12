const totalService = require("../services/totalwine.service");

function getWine(req, res) {
  try {
    totalService.totalWineWine().catch(err => console.error("TotalWine wine error:", err));
    res.json({ status: "started", source: "totalwine", type: "wine" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start totalwine wine scrape" });
  }
}

function getSpirits(req, res) {
  try {
    totalService.totalWineSpirits().catch(err => console.error("TotalWine spirits error:", err));
    res.json({ status: "started", source: "totalwine", type: "spirits" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start totalwine spirits scrape" });
  }
}

module.exports = {
  getWine,
  getSpirits,
};
