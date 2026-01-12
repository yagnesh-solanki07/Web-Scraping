const express = require("express");
const router = express.Router();
const controller = require("../controllers/specsonline.controller");


// GET /specsonline/wine
router.get("/wine", controller.getWine);

// GET /specsonline/spirits
router.get("/spirits", controller.getSpirits);

module.exports = router;
