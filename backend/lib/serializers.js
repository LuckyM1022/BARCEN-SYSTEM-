export const serializeDocument = (document) => {
  if (!document) {
    return document;
  }

  const { _id, ...rest } = document;
  return {
    id: String(_id),
    ...rest,
  };
};

export const publicUser = (user) => {
  const { password, ...safeUser } = serializeDocument(user);
  return safeUser;
};
