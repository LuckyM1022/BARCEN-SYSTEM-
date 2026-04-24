/**
 * @desc Authenticate a user and issue a session token
 * @route POST /api/auth/login
 * @access Public
 */
export const login = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.auth.login(req.body || {}));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Register a new census taker account
 * @route POST /api/auth/register
 * @access Public
 */
export const register = (services) => async (req, res, next) => {
  try {
    res.status(201).json(await services.auth.register(req.body || {}));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update the current user's profile
 * @route PUT /api/auth/profile
 * @access Authenticated
 */
export const updateProfile = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.auth.updateProfile(req.currentUser, req.body || {}));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Change the current user's password
 * @route PUT /api/auth/password
 * @access Authenticated
 */
export const updatePassword = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.auth.updatePassword(req.currentUser, req.body || {}));
  } catch (error) {
    next(error);
  }
};
