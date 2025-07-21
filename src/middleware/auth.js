const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('Auth middleware hit for:', req.path);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  const token = req.header('x-auth-token');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, user:', decoded);
    req.user = decoded; // (decoded payload, e.g. { id: ... })
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 