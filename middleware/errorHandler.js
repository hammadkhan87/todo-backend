export default function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Default error
  let error = {
    message: err.message || "Server Error",
    statusCode: err.statusCode || 500
  };

  res.status(error.statusCode).json({
    success: false,
    error: error.message
  });
}