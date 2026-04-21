function createCensusRepository(db, syncQueue) {
  const collection = db.collection('censusRecords');

  return {
    async createIndexes() {
      await collection.createIndex({ createdAt: -1 });
    },
    countAll() {
      return collection.countDocuments();
    },
    findAll() {
      return collection.find({}).sort({ createdAt: -1 }).toArray();
    },
    async insertOne(record) {
      const result = await collection.insertOne(record);

      if (syncQueue) {
        await syncQueue.queueUpsert('censusRecords', { _id: result.insertedId, ...record });
      }

      return result;
    },
  };
}

module.exports = {
  createCensusRepository,
};
