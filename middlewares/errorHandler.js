module.exports = (err, req, res, next) => {
  console.error(err);

  if (Array.isArray(err.message)) {
    return res.status(err.status || 400).json({
      errors: err.message.map((e) => e.msg),
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Server Error",
  });
};
