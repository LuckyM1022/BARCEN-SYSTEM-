import { AppError } from '../lib/errors.js';
import { createResidentFromCensusRecord, createResidentSearchQuery } from '../lib/report.utils.js';
import { serializeDocument } from '../lib/serializers.js';
import { isValidObjectId } from '../lib/validators.js'

function createReportService(repositories, syncService) {
  return {
    async listResidents(options = {}) {
      const { page = 0, pageSize = 10, search = '' } = options;
      const result = await syncService.paginateCollection('residents', {
        page,
        pageSize,
        query: createResidentSearchQuery(search),
      });

      return {
        residents: result.items.map(serializeDocument),
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
      };
    },

    async createResident(body, currentUser) {
      if (!body.name || !body.address) {
        throw new AppError(400, 'Resident name and address are required.');
      }

      const resident = {
        name: String(body.name).trim(),
        address: String(body.address).trim(),
        birthday: body.birthday ? String(body.birthday).trim() : '',
        submittedBy: currentUser?.name || 'Admin / Validator',
        createdAt: new Date(),
        updatedAt: new Date(),
        atlasSyncedAt: null,
      };

      const result = await repositories.residents.insertOne(resident);
      return { resident: serializeDocument({ _id: result.insertedId, ...resident }) };
    },

    async deleteResident(residentId) {
      if (!isValidObjectId(residentId)) {
        throw new AppError(400, 'Invalid resident id.');
      }

      const result = await repositories.residents.deleteOne(residentId);
      if (!result.deletedCount) {
        throw new AppError(404, 'Resident not found.');
      }

      return { message: 'Resident removed.' };
    },

    async listCensusRecords(options = {}) {
      const { page = 0, pageSize = 10 } = options;
      const result = await syncService.paginateCollection('censusRecords', {
        page,
        pageSize,
        sort: { createdAt: -1 },
      });

      return {
        records: result.items.map(serializeDocument),
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
      };
    },

    async createCensusRecord(body, currentUser) {
      if (!body.firstName || !body.lastName || !body.birthday || !body.genderAtBirth || !body.area) {
        throw new AppError(400, 'First name, last name, birthday, gender, and purok are required.');
      }

      const record = {
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
        atlasSyncedAt: null,
        submittedBy: currentUser?.name || 'Census Taker',
      };

      const result = await repositories.census.insertOne(record);
      const savedRecord = { _id: result.insertedId, ...record };

      await repositories.residents.insertOne(
        createResidentFromCensusRecord(savedRecord, currentUser?.name || 'Census Taker')
      );

      return { record: serializeDocument(savedRecord) };
    },
  };
}

export {
  createReportService,
};
