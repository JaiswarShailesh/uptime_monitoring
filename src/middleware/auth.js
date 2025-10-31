const jwt = require('jsonwebtoken');
const prisma = require('../db');
const SECRET = process.env.JWT_SECRET;

function authMiddleware(requiredRole = null) {
  return async (req, res, next) => {
    try {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized: token missing' });

      const token = auth.split(' ')[1];
      let payload;
      try {
        payload = jwt.verify(token, SECRET);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) return res.status(401).json({ error: 'User not found' });

      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden: insufficient role' });
      }

      // attach sanitized user
      req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
      next();
    } catch (err) {
      console.error('AUTH MID ERR', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };
}

module.exports = authMiddleware;
