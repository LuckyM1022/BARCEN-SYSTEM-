const parseAllowedOrigins = (frontendOrigin = '') => {
  return String(frontendOrigin || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const createCorsMiddleware = (frontendOrigin) => {
  const allowedOrigins = parseAllowedOrigins(frontendOrigin);

  return (req, res, next) => {
    const requestOrigin = req.headers.origin;
    const allowAnyOrigin = allowedOrigins.includes('*');
    const isAllowedOrigin =
      Boolean(requestOrigin) &&
      (allowAnyOrigin || allowedOrigins.includes(requestOrigin));

    if (isAllowedOrigin) {
      // Echo the approved browser origin so credentialed requests work on Render and locally.
      res.header('Access-Control-Allow-Origin', requestOrigin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
};
