// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Get the Authorization header value
  const authHeader = req.headers['authorization'];
  // Expecting format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('No token provided in request headers');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in process.env');
    return res.status(500).json({ message: 'Server misconfiguration' });
  }

  // Log the received token for debugging (remove or mask in production)
  console.log('Received token:', token);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Invalid token:', err);
      return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
    // Log the decoded token payload to verify its contents
    console.log('Decoded token payload:', decoded);
    // Expecting decoded payload to include { id, role }
    req.user = decoded;
    next();
  });
};

module.exports = { authenticateToken };
