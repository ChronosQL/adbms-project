/**
 * Standardized Pagination Helper for TechNova
 * Supports pure PostgreSQL queries using window function COUNT(*) OVER()
 */

const parsePagination = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10);
  const limit = Math.min(maxLimit, Math.max(1, rawLimit || defaultLimit));
  const offset = (page - 1) * limit;

  const buildPagination = (totalCount) => {
    const total = Number(totalCount) || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  };

  return {
    page,
    limit,
    offset,
    buildPagination,
  };
};

module.exports = {
  parsePagination,
};
