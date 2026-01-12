const express = require("express");
const app = express();

const specsonlineRoutes = require("./routes/specsonline.routes");
const totalwineRoutes = require("./routes/totalwine.routes");

app.use(express.json());

app.use("/specsonline", specsonlineRoutes);
app.use("/totalwine", totalwineRoutes);

app.get("/", (req, res) => res.json({ ok: true, routes: ["/specsonline/wine","/specsonline/spirits","/totalwine/wine","/totalwine/spirits"] }));

module.exports = app;
