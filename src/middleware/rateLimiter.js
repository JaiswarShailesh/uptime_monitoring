const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
});

module.exports = { authLimiter };
