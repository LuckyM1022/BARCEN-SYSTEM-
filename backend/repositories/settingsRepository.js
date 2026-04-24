function createSettingsRepository(db, syncQueue) {
  const collection = db.collection('settings');

  return {
    async createIndexes() {
      await collection.createIndex({ scope: 1 }, { unique: true });
    },
    countAll() {
      return collection.countDocuments();
    },
    findAll() {
      return collection.find({}).toArray();
    },
    findByScope(scope) {
      return collection.findOne({ scope });
    },
    insertMany(settings) {
      return collection.insertMany(settings);
    },
    async updateByScope(scope, updates) {
      const result = await collection.findOneAndUpdate(
        { scope },
        { $set: updates },
        { upsert: true, returnDocument: 'after' }
      );

      if (result && syncQueue) {
        await syncQueue.queueUpsert('settings', result);
      }

      return result;
    },
  };
}

export {
  createSettingsRepository,
};
