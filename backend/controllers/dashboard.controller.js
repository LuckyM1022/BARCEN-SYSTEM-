/**
 * @desc Get dashboard summary statistics
 * @route GET /api/dashboard/stats
 * @access Admin, Personnel / Validator
 */
export const getStats = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.dashboard.getStats());
  } catch (error) {
    next(error);
  }
};
