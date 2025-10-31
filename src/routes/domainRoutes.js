const express = require("express");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const router = express.Router();
const prisma = new PrismaClient();

// Load API key securely from env
const WHOIS_API_KEY = process.env.WHOIS_API_KEY;

if (!WHOIS_API_KEY) {
  console.error("❌ WHOIS_API_KEY not found in .env file");
}

// Utility: Extract domain name cleanly from URL
function extractDomain(url) {
  try {
    return url.replace(/(^\w+:|^)\/\//, "").split("/")[0];
  } catch {
    return null;
  }
}

router.get("/:websiteId", async (req, res) => {
  try {
    const { websiteId } = req.params;

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) return res.status(404).json({ error: "Website not found" });

    const domain = extractDomain(website.url);
    if (!domain) return res.status(400).json({ error: "Invalid domain" });

    console.log(`🔍 Checking domain expiry for: ${domain}`);

    const apiUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    const expiryDate =
      data?.WhoisRecord?.registryData?.expiresDate ||
      data?.WhoisRecord?.expiresDate ||
      null;

    if (!expiryDate) {
      return res.status(400).json({
        error: "Expiry date not found in WHOIS data",
      });
    }

    const updated = await prisma.website.update({
      where: { id: websiteId },
      data: { domainExpiry: new Date(expiryDate) },
    });

    res.json({
      message: "✅ Domain expiry updated successfully",
      domain,
      expiryDate: updated.domainExpiry,
    });
  } catch (error) {
    console.error("❌ Domain check failed:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
