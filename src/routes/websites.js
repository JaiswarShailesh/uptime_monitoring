const express = require("express");
const prisma = require("../db");
const auth = require("../middleware/auth");
const isValidUrl = require("../utils/validateUrl");

const router = express.Router();

// Create website
router.post("/", auth(), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });
    if (!isValidUrl(url)) return res.status(400).json({ error: "Invalid URL" });

    // prevent duplicate entries for same user
    const existing = await prisma.website.findFirst({
      where: { url, userId: req.user.id },
    });
    if (existing)
      return res.status(400).json({ error: "Website already exists" });

    const site = await prisma.website.create({
      data: { url, userId: req.user.id },
    });

    return res.status(201).json(site);
  } catch (err) {
    console.error("CREATE SITE ERR", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// List user's websites
router.get("/", auth(), async (req, res) => {
  try {
    const sites = await prisma.website.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json(sites);
  } catch (err) {
    console.error("LIST SITES ERR", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get single website
router.get("/:id", auth(), async (req, res) => {
  const { id } = req.params;
  try {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site || site.userId !== req.user.id)
      return res.status(404).json({ error: "Not found" });
    return res.json(site);
  } catch (err) {
    console.error("GET SITE ERR", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Update website (e.g., change url)
router.put("/:id", auth(), async (req, res) => {
  const { id } = req.params;
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });

  try {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site || site.userId !== req.user.id)
      return res.status(404).json({ error: "Not found" });

    const updated = await prisma.website.update({
      where: { id },
      data: { url },
    });
    return res.json(updated);
  } catch (err) {
    console.error("UPDATE SITE ERR", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Delete
router.delete("/:id", auth(), async (req, res) => {
  const { id } = req.params;
  try {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site || site.userId !== req.user.id)
      return res.status(404).json({ error: "Not found" });
    await prisma.website.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE SITE ERR", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
