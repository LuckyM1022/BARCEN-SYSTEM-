const { ObjectId } = require('mongodb');

function createUsersRepository(db) {
  const collection = db.collection('users');

  return {
    async createIndexes() {
      await collection.createIndex({ email: 1 }, { unique: true });
    },
    countAll() {
      return collection.countDocuments();
    },
    countByRole(role) {
      return collection.countDocuments({ role });
    },
    findAll() {
      return collection.find({}).sort({ name: 1 }).toArray();
    },
    findByEmail(email) {
      return collection.findOne({ email });
    },
    findByEmailExcludingId(email, userId) {
      return collection.findOne({
        email,
        _id: { $ne: new ObjectId(userId) },
      });
    },
    findById(userId) {
      return collection.findOne({ _id: new ObjectId(userId) });
    },
    findAllRaw() {
      return collection.find({}).toArray();
    },
    insertOne(user) {
      return collection.insertOne(user);
    },
    insertMany(users) {
      return collection.insertMany(users);
    },
    updatePassword(userId, password) {
      return collection.updateOne({ _id: new ObjectId(userId) }, { $set: { password } });
    },
    updateOne(userId, updates) {
      return collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updates },
        { returnDocument: 'after' }
      );
    },
    deleteOne(userId) {
      return collection.deleteOne({ _id: new ObjectId(userId) });
    },
  };
}

module.exports = {
  createUsersRepository,
};
