export const requireAuth = (services) => async (req, res, next) => {
  try {
    const { currentUser } = await services.auth.authenticateRequest(req, req.path);
    req.currentUser = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};
