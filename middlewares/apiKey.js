// apiKeyMiddleware.js

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.header("x-api-key") || req.query.apiKey;

  if (apiKey === process.env.API_KEY) {
    // If API key is valid, proceed to the next middleware or route
    return next();
  }

  // If the API key is missing or invalid, return an unauthorized response
  res.status(401).json({ error: "Unauthorized: Invalid API Key" });
};

export default apiKeyMiddleware;
