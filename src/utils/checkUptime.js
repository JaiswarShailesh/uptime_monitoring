const whois = require('whois-json');

async function getDomainExpiry(host) {
  try {
    const info = await whois(host);
    // whois output varies. common fields: 'expiryDate', 'expires', 'paid-till'
    const possible = info.expiryDate || info.expires || info['paid-till'] || info['Registry Expiry Date'];
    if (!possible) return null;
    const d = new Date(possible);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
}

module.exports = getDomainExpiry;
