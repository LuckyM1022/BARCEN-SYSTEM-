const { ObjectId } = require('mongodb');

function createRolesRepository(db) {
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
    insertOne(role) {
      return collection.insertOne(role);
    },
    insertMany(roles) {
      return collection.insertMany(roles);
    },
    updateOne(roleId, role) {
      return collection.findOneAndUpdate(
        { _id: new ObjectId(roleId) },
        { $set: role },
        { returnDocument: 'after' }
      );
    },
  };
}

module.exports = {
  createRolesRepository,
};
