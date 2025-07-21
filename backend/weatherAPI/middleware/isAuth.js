const jwt = require('jsonwebtoken');

const isAuthenticated = async (req, res, next) => {
  try {
    console.log(`[Auth] Processing request to: ${req.path}`);
    const headerObject = req.headers;
    const authHeader = headerObject.authorization;

    if (!authHeader) {
      console.log('[Auth] ❌ No authorization header provided');
      return res
        .status(401)
        .json({ error: 'No authorization header provided' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('[Auth] ❌ Invalid authorization header format');
      return res
        .status(401)
        .json({ error: 'Invalid authorization header format' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('[Auth] ❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const verifyToken = jwt.verify(token, 'anykey', (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return false;
      } else {
        return decoded;
      }
    });

    if (verifyToken) {
      console.log('[Auth] Token decoded successfully:', {
        userId: verifyToken.id,
        tokenData: verifyToken,
      });
      req.user = verifyToken.id;
      next();
    } else {
      console.log('[Auth] Token verification failed');
      return res
        .status(401)
        .json({ error: 'Token expired, please login again' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = isAuthenticated;
