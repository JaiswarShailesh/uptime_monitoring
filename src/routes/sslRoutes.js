const express = require("express");
const sslChecker = require("ssl-checker");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Extract domain cleanly from a given URL
function extractDomain(url) {
  try {
    return url.replace(/(^\w+:|^)\/\//, "").split("/")[0];
  } catch {
    return null;
  }
}

// GET /api/check-ssl/:websiteId
router.get("/:websiteId", async (req, res) => {
  try {
    const { websiteId } = req.params;

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    const domain = extractDomain(website.url);
    if (!domain) {
      return res.status(400).json({ error: "Invalid domain" });
    }

    console.log(`🔍 Checking SSL for: ${domain}`);

    // sslChecker expects domain without protocol
    const sslInfo = await sslChecker(domain, { method: "GET", port: 443 });

    const sslExpiry = sslInfo.validTo ? new Date(sslInfo.validTo) : null;
    const daysRemaining = sslInfo.daysRemaining ?? "N/A";
    const valid = sslInfo.valid;

    // Update the website table with new SSL info
    const updated = await prisma.website.update({
      where: { id: websiteId },
      data: { sslExpiry },
    });

    res.json({
      message: "✅ SSL details updated successfully",
      domain,
      valid,
      sslExpiry,
      daysRemaining,
    });
  } catch (error) {
    console.error("❌ SSL check failed:", error.message);
    res.status(500).json({ error: "Failed to check SSL" });
  }
});

module.exports = router;
