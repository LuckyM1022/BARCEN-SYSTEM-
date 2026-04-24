/**
 * @desc Get validator workspace settings
 * @route GET /api/validator/settings
 * @access Admin, Personnel / Validator
 */
export const getSettings = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.validator.getSettings());
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update validator workspace settings
 * @route PUT /api/validator/settings
 * @access Admin, Personnel / Validator
 */
export const updateSettings = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.validator.updateSettings(req.body || {}));
  } catch (error) {
    next(error);
  }
};
