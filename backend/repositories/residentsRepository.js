const { ObjectId } = require('mongodb');

function createResidentsRepository(db, syncQueue) {
  const collection = db.collection('residents');

  return {
    async createIndexes() {
      await collection.createIndex({ name: 1 });
    },
    countAll() {
      return collection.countDocuments();
    },
    findAll() {
      return collection.find({}).sort({ name: 1 }).toArray();
    },
    async insertOne(resident) {
      const result = await collection.insertOne(resident);

      if (syncQueue) {
        await syncQueue.queueUpsert('residents', { _id: result.insertedId, ...resident });
      }

      return result;
    },
    insertMany(residents) {
      return collection.insertMany(residents);
    },
    async deleteOne(residentId) {
      const normalizedResidentId = new ObjectId(residentId);
      const result = await collection.deleteOne({ _id: normalizedResidentId });

      if (result.deletedCount && syncQueue) {
        await syncQueue.queueDelete('residents', normalizedResidentId);
      }

      return result;
    },
  };
}

module.exports = {
  createResidentsRepository,
};
