const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

// Parses "Authorization: Basic base64(username:password)", verifies against the
// Admin table, and attaches req.admin if valid. Does NOT reject the request by
// itself — that's what requireAuth/requireRole are for. This mirrors Spring
// Security's httpBasic() + permitAll()-by-default behavior: most routes stay
// open, but ones that call requireAuth/requireRole enforce it.
async function basicAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Basic ')) {
    return next();
  }

  try {
    const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
    const sepIndex = decoded.indexOf(':');
    const username = decoded.slice(0, sepIndex);
    const password = decoded.slice(sepIndex + 1);

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) return next();

    const matches = await bcrypt.compare(password, admin.password);
    if (matches) {
      req.admin = admin; // Sequelize instance, includes hashed password - don't send this back as-is
    }
  } catch (err) {
    // Malformed header - treat as unauthenticated, same as Spring would.
  }

  return next();
}

function requireAuth(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (req.admin.role !== role) {
      return res.status(403).json({ message: `Requires ${role} role` });
    }
    return next();
  };
}

module.exports = { basicAuth, requireAuth, requireRole };
