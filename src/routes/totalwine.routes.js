const express = require("express");
const router = express.Router();
const controller = require("../controllers/totalwine.controller");

// GET /totalwine/wine
router.get("/wine", controller.getWine);

// GET /totalwine/spirits
router.get("/spirits", controller.getSpirits);

module.exports = router;
