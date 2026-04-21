function createSettingsRepository(db) {
  const collection = db.collection('settings');

  return {
    async createIndexes() {
      await collection.createIndex({ scope: 1 }, { unique: true });
    },
    countAll() {
      return collection.countDocuments();
    },
    findByScope(scope) {
      return collection.findOne({ scope });
    },
    insertMany(settings) {
      return collection.insertMany(settings);
    },
    updateByScope(scope, updates) {
      return collection.findOneAndUpdate(
        { scope },
        { $set: updates },
        { upsert: true, returnDocument: 'after' }
      );
    },
  };
}

module.exports = {
  createSettingsRepository,
};
