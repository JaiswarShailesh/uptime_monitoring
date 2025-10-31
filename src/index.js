require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const authRoutes = require("./routes/auth");
const websitesRoutes = require("./routes/websites");
const { startCron } = require("./jobs/cronCheck");
// import domainRoutes from "./src/routes/domainRoutes.js";
const morgan = require("morgan");
const domainRoutes = require("./routes/domainRoutes.js");
const sslRoutes = require("./routes/sslRoutes");
const { authLimiter } = require("./middleware/rateLimiter.js");

// const { startCron } = require("./cron");

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/websites", websitesRoutes);
app.use("/api/check-domain", domainRoutes);
app.use("/api/check-ssl", sslRoutes);

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/me", require("./middleware/auth")(), (req, res) => {
  res.json({ ok: true, user: req.user });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
  // start cron after server up
  startCron();
});

const { runCheckForAllSites } = require("./jobs/cronCheck");

app.post(
  "/api/admin/trigger-check",
  require("./middleware/auth")("admin"),
  async (req, res) => {
    try {
      await runCheckForAllSites();
      return res.json({ ok: true, message: "Triggered checks" });
    } catch (err) {
      console.error("TRIGGER ERR", err);
      return res.status(500).json({ error: "Trigger failed" });
    }
  }
);
