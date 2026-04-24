import { ObjectId } from "mongodb";

function createUsersRepository(db, syncQueue) {
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
    async insertOne(user) {
      const result = await collection.insertOne(user);

      if (syncQueue) {
        await syncQueue.queueUpsert('users', { _id: result.insertedId, ...user });
      }

      return result;
    },
    insertMany(users) {
      return collection.insertMany(users);
    },
    updatePassword(userId, password) {
      return collection.updateOne({ _id: new ObjectId(userId) }, { $set: { password } });
    },
    async updateOne(userId, updates) {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (result && syncQueue) {
        await syncQueue.queueUpsert('users', result);
      }

      return result;
    },
    async deleteOne(userId) {
      const normalizedUserId = new ObjectId(userId);
      const result = await collection.deleteOne({ _id: normalizedUserId });

      if (result.deletedCount && syncQueue) {
        await syncQueue.queueDelete('users', normalizedUserId);
      }

      return result;
    },
  };
}

export {
  createUsersRepository,
};
