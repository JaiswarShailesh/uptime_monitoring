const sslChecker = require('ssl-checker');

async function getSSLExpiry(host) {
  // host: without protocol, e.g. example.com
  try {
    const info = await sslChecker(host, { method: 'GET', port: 443 });
    // info.validTo is ISO date string
    return info.validTo ? new Date(info.validTo) : null;
  } catch (e) {
    return null;
  }
}
module.exports = getSSLExpiry;
