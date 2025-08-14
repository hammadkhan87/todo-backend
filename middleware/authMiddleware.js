import jwt from 'jsonwebtoken';
import xss from 'xss';

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";

export function authenticateToken(req, res, next) {
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// Sanitize input middleware
export function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
}