const { AppError } = require('../lib/errors');
const { serializeDocument } = require('../lib/serializers');
const { isValidObjectId } = require('../lib/validators');

function createResidentFromCensusRecord(record, submittedBy = 'Census Taker') {
  const name = [record.firstName, record.middleName, record.lastName, record.suffix]
    .filter(Boolean)
    .join(' ');

  const address = [
    record.houseNumber,
    record.area,
    record.barangay,
    record.municipality,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    name,
    address,
    submittedBy,
    censusRecordId: record._id,
    createdAt: new Date(),
  };
}

function createResidentService(repositories) {
  return {
    async listResidents() {
      const residents = await repositories.residents.findAll();
      return { residents: residents.map(serializeDocument) };
    },

    async createResident(body, currentUser) {
      if (!body.name || !body.address) {
        throw new AppError(400, 'Resident name and address are required.');
      }

      const resident = {
        name: String(body.name).trim(),
        address: String(body.address).trim(),
        submittedBy: currentUser?.name || 'Admin / Validator',
        createdAt: new Date(),
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

    async listCensusRecords() {
      const records = await repositories.census.findAll();
      return { records: records.map(serializeDocument) };
    },

    async createCensusRecord(body, currentUser) {
      if (!body.firstName || !body.lastName || !body.birthday || !body.genderAtBirth || !body.area) {
        throw new AppError(400, 'First name, last name, birthday, gender, and purok are required.');
      }

      const record = {
        ...body,
        createdAt: new Date(),
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

module.exports = {
  createResidentService,
};
