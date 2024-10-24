const jwt = require('jsonwebtoken');

const isAuthenticated = async (req, res, next) => {
  const headerObject = req.headers;
  const token = headerObject.authorization.split(' ')[1];

  const verifyToken = jwt.verify(token, 'anykey', (err, decoded) => {
    if (err) {
      return false;
    } else {
      return decoded;
    }
  });

  if (verifyToken) {
    req.user = verifyToken.id;
    next();
  } else {
    const err = new Error('Token expired, please login again');
    next(err);
  }
};

module.exports = isAuthenticated;
