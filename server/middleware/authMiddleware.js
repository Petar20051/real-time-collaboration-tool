const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('❌ No token provided in request headers');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not defined in environment variables.');
    return res.status(500).json({ message: 'Server misconfiguration' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ Invalid token:', err.message);
      return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }

    console.log('✅ Token verified:', decoded);
    req.user = decoded;
    next();
  });
};

module.exports = { authenticateToken };
