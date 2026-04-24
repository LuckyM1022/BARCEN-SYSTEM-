/**
 * @desc Get Atlas sync queue status
 * @route GET /api/sync/status
 * @access Public
 */
export const getStatus = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.sync.getStatus());
  } catch (error) {
    next(error);
  }
};
