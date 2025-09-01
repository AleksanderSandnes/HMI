const { logRequest } = require('../services/graylogService');

const graylogMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Store the original end function
  const originalEnd = res.end;
  
  // Override the end function to log when response is sent
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log the request to Graylog (async, don't block response)
    setImmediate(() => {
      logRequest(req, res, duration, {
        request_body_size: req.get('Content-Length') || 0,
        response_body_size: res.get('Content-Length') || 0,
      });
    });
    
    // Call the original end function
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = graylogMiddleware;
