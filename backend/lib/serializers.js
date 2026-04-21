function serializeDocument(document) {
  if (!document) {
    return document;
  }

  const { _id, ...rest } = document;
  return {
    id: String(_id),
    ...rest,
  };
}

function publicUser(user) {
  const { password, ...safeUser } = serializeDocument(user);
  return safeUser;
}

module.exports = {
  publicUser,
  serializeDocument,
};
