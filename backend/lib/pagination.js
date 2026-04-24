export const parsePaginationQuery = (query = {}, options = {}) => {
  const {
    defaultPage = 0,
    defaultPageSize = 10,
    maxPageSize = 50,
  } = options;

  const page = Math.max(0, Number.parseInt(query.page, 10) || defaultPage);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, Number.parseInt(query.pageSize, 10) || defaultPageSize)
  );

  return {
    page,
    pageSize,
  };
};
