const axios = require("axios");
const https = require("https");
const sslChecker = require("ssl-checker");
const prisma = require("../db");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

// Extract domain name from URL
function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ✅ Domain expiry via WhoisXML API
async function getDomainExpiry(domain) {
  try {
    const apiKey = process.env.WHOIS_API_KEY;
    const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`;
    const { data } = await axios.get(url);

    const expiry =
      data.WhoisRecord?.registryData?.expiresDate ||
      data.WhoisRecord?.expiresDate ||
      null;

    if (expiry) return new Date(expiry);
    console.warn(`⚠️ WHOIS: No expiry found for ${domain}`);
    return null;
  } catch (err) {
    console.warn(`⚠️ WHOIS failed for ${domain}:`, err.message);
    return null;
  }
}

// ✅ Uptime check
async function checkWebsite(site) {
  const start = Date.now();
  try {
    const res = await axios.get(site.url, {
      timeout: 20000,
      maxRedirects: 5,
      httpsAgent,
    });
    const responseTime = Date.now() - start;
    const status = res.status;
    const isUp = status >= 200 && status < 400;
    return { isUp, status, responseTime, error: null };
  } catch (err) {
    const responseTime = Date.now() - start;
    return {
      isUp: false,
      status: err.response?.status || 0,
      responseTime,
      error: err.message,
    };
  }
}

// ✅ Main cron job
async function runCron() {
  console.log("🔍 Running uptime, SSL & domain checks...");
  const websites = await prisma.website.findMany();

  for (const site of websites) {
    const domain = extractDomain(site.url);
    const { status, isUp, responseTime, error } = await checkWebsite(site);

    let sslExpiry = null;
    try {
      const sslInfo = await sslChecker(domain);
      sslExpiry = sslInfo.validTo ? new Date(sslInfo.validTo) : null;
    } catch (e) {
      console.warn(`⚠️ SSL check failed for ${site.url}:`, e.message);
    }

    // const domainExpiry = domain ? await getDomainExpiry(domain) : null;

    // ✅ Log the status
    if (isUp)
      console.log(`✅ ${site.url} UP (${status}) - ${responseTime}ms`);
    else console.log(`❌ ${site.url} DOWN: ${error}`);

    // ✅ Record this check
    await prisma.check.create({
      data: {
        websiteId: site.id,
        statusCode: status || 0,
        responseTime,
        isUp,
        error: error || "",
      },
    });

    // ✅ Update Website
    await prisma.website.update({
      where: { id: site.id },
      data: {
        status: isUp ? "UP" : "DOWN",
        responseTime,
        sslExpiry,
        // domainExpiry,
        lastChecked: new Date(),
      },
    });
  }
}

function startCron() {
  console.log("⏱️ Cron started: checking every 1 minutes...");
  runCron();
  setInterval(runCron, 60 * 1000);
}

module.exports = { startCron };
