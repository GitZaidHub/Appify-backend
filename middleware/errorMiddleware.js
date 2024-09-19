// 404 Not Found Middleware
const notFound = (req, res, next) => {
    const error = new Error(`${req.originalUrl} not found`); // Correct spelling: req.originalUrl
    res.status(404);
    next(error); // Pass the error to the next middleware
  };
  
  // Global Error Handler Middleware
  const errorHandler = (err, req, res, next) => {
    // Check if headers have already been sent
    if (res.headersSent) {
      return next(err); // Pass the error to the default handler if headers are already sent
    }
    
    // Send the error response
    res
      .status(err.statusCode || 500) // Use the status code from the error or default to 500
      .json({ message: err.message || 'An unknown error occurred' });
  };
  
  module.exports = { notFound, errorHandler };
  