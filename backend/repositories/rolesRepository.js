import { ObjectId } from "mongodb";

function createRolesRepository(db, syncQueue) {
  const collection = db.collection('roles');

  return {
    async createIndexes() {
      await collection.createIndex({ name: 1 }, { unique: true });
    },
    countAll() {
      return collection.countDocuments();
    },
    findAll() {
      return collection.find({}).sort({ name: 1 }).toArray();
    },
    findByName(name) {
      return collection.findOne({ name });
    },
    findByNameExcludingId(name, roleId) {
      return collection.findOne({
        name,
        _id: { $ne: new ObjectId(roleId) },
      });
    },
    async insertOne(role) {
      const result = await collection.insertOne(role);

      if (syncQueue) {
        await syncQueue.queueUpsert('roles', { _id: result.insertedId, ...role });
      }

      return result;
    },
    insertMany(roles) {
      return collection.insertMany(roles);
    },
    async updateOne(roleId, role) {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(roleId) },
        { $set: role },
        { returnDocument: 'after' }
      );

      if (result && syncQueue) {
        await syncQueue.queueUpsert('roles', result);
      }

      return result;
    },
    async deleteOne(roleId) {
      const normalizedRoleId = new ObjectId(roleId);
      const result = await collection.deleteOne({ _id: normalizedRoleId });

      if (result.deletedCount && syncQueue) {
        await syncQueue.queueDelete('roles', normalizedRoleId);
      }

      return result;
    },
  };
}

export {
  createRolesRepository,
};
