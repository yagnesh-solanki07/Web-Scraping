const express = require("express");
const app = express();

/*
Postman - API Endpoints

Base URL: http://localhost:3000/api/specsonline/wine
Base URL: http://localhost:3000/api/specsonline/spirits
Base URL: http://localhost:3000/api/totalwine/wine
Base URL: http://localhost:3000/api/totalwine/spirits

*/

// register routes from index
require('./routes')(app);

app.use(express.json());

// routes are mounted by src/routes/index.js

app.get("/", (req, res) => res.json({ ok: true, routes: ["/api/specsonline/wine","/api/specsonline/spirits","/api/totalwine/wine","/api/totalwine/spirits"] }));

module.exports = app;
