/**
 * @desc List all users
 * @route GET /api/users
 * @access Admin
 */
export const listUsers = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.listUsers());
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create a new user
 * @route POST /api/users
 * @access Admin
 */
export const createUser = (services) => async (req, res, next) => {
  try {
    res.status(201).json(await services.admin.createUser(req.body || {}));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update an existing user
 * @route PUT /api/users/:userId
 * @access Admin
 */
export const updateUser = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.updateUser(req.params.userId, req.body || {}));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a user
 * @route DELETE /api/users/:userId
 * @access Admin
 */
export const deleteUser = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.deleteUser(req.params.userId));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc List all roles
 * @route GET /api/admin/roles
 * @access Admin
 */
export const listRoles = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.listRoles());
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create a role
 * @route POST /api/admin/roles
 * @access Admin
 */
export const createRole = (services) => async (req, res, next) => {
  try {
    res.status(201).json(await services.admin.createRole(req.body || {}));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update a role
 * @route PUT /api/admin/roles/:roleId
 * @access Admin
 */
export const updateRole = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.updateRole(req.params.roleId, req.body || {}));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a role
 * @route DELETE /api/admin/roles/:roleId
 * @access Admin
 */
export const deleteRole = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.deleteRole(req.params.roleId));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get admin platform settings
 * @route GET /api/admin/settings
 * @access Admin
 */
export const getSettings = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.getAdminSettings());
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update admin platform settings
 * @route PUT /api/admin/settings
 * @access Admin
 */
export const updateSettings = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.admin.updateAdminSettings(req.body || {}));
  } catch (error) {
    next(error);
  }
};
