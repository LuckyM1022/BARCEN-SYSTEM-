/**
 * @desc Get API root status
 * @route GET /
 * @access Public
 */
export const getRoot = (req, res, next) => {
  res.status(200).json({
    status: 'ok',
    service: 'barcen-api',
    message: 'Barcen API is running. Use /api/health to verify service status.',
  });
};

/**
 * @desc Get API namespace status
 * @route GET /api
 * @access Public
 */
export const getApiRoot = (req, res, next) => {
  res.status(200).json({
    status: 'ok',
    service: 'barcen-api',
    message: 'API namespace is available.',
  });
};

/**
 * @desc Get backend health status
 * @route GET /api/health
 * @access Public
 */
export const getHealth = (req, res, next) => {
  res.status(200).json({
    status: 'ok',
    service: 'barcen-api',
  });
};
