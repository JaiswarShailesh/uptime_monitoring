const axios = require('axios');

async function checkUptime(url) {
  try {
    const res = await axios.get(url, { timeout: 8000, validateStatus: () => true });
    return res.status < 500;
  } catch (e) {
    return false;
  }
}

module.exports = checkUptime;
