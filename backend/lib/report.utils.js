export const createResidentFromCensusRecord = (record, submittedBy = 'Census Taker') => {
  const name = [record.firstName, record.middleName, record.lastName, record.suffix]
    .filter(Boolean)
    .join(' ');

  const address = [
    record.houseNumber,
    record.area,
    record.barangay,
    record.municipality,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    name,
    address,
    birthday: record.birthday || '',
    submittedBy,
    censusRecordId: record._id,
    createdAt: new Date(),
    updatedAt: new Date(),
    atlasSyncedAt: null,
  };
};

export const createResidentSearchQuery = (search = '') => {
  const normalizedSearch = String(search || '').trim();

  if (!normalizedSearch) {
    return {};
  }

  return {
    $or: [
      { name: { $regex: normalizedSearch, $options: 'i' } },
      { address: { $regex: normalizedSearch, $options: 'i' } },
      { submittedBy: { $regex: normalizedSearch, $options: 'i' } },
    ],
  };
};
