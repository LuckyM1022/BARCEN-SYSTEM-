import { parsePaginationQuery } from '../lib/pagination.js';

/**
 * @desc List residents with server-side pagination and optional search
 * @route GET /api/residents
 * @access Admin, Personnel / Validator
 */
export const listResidents = (services) => async (req, res, next) => {
  try {
    const { page, pageSize } = parsePaginationQuery(req.query || {});
    res.status(200).json(
      await services.reports.listResidents({
        page,
        pageSize,
        search: req.query?.search || '',
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create a resident record
 * @route POST /api/residents
 * @access Admin, Personnel / Validator
 */
export const createResident = (services) => async (req, res, next) => {
  try {
    res.status(201).json(await services.reports.createResident(req.body || {}, req.currentUser));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a resident record
 * @route DELETE /api/residents/:residentId
 * @access Admin, Personnel / Validator
 */
export const deleteResident = (services) => async (req, res, next) => {
  try {
    res.status(200).json(await services.reports.deleteResident(req.params.residentId));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc List census records with server-side pagination
 * @route GET /api/census-records
 * @access Admin, Personnel / Validator
 */
export const listCensusRecords = (services) => async (req, res, next) => {
  try {
    const { page, pageSize } = parsePaginationQuery(req.query || {});
    res.status(200).json(await services.reports.listCensusRecords({ page, pageSize }));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create a census record and queue it for Atlas sync
 * @route POST /api/census-records
 * @access Admin, Personnel / Validator, Census Taker
 */
export const createCensusRecord = (services) => async (req, res, next) => {
  try {
    res.status(201).json(await services.reports.createCensusRecord(req.body || {}, req.currentUser));
  } catch (error) {
    next(error);
  }
};
