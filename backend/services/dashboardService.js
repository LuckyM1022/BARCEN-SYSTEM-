function createDashboardService(repositories) {
  return {
    async getStats() {
      const [residentCount, completedSurveys, activeEnumerators] = await Promise.all([
        repositories.residents.countAll(),
        repositories.census.countAll(),
        repositories.users.countByRole('Census Taker'),
      ]);

      return {
        stats: [
          {
            label: 'Total Households',
            value: residentCount.toLocaleString(),
            note: 'Across Sto. Nino Sapa',
          },
          {
            label: 'Completed Surveys',
            value: completedSurveys.toLocaleString(),
            note: 'Saved census records',
          },
          {
            label: 'Active Enumerators',
            value: activeEnumerators.toLocaleString(),
            note: 'Assigned census takers',
          },
          {
            label: 'Pending Reviews',
            value: '64',
            note: 'Needs validator review',
          },
        ],
      };
    },
  };
}

module.exports = {
  createDashboardService,
};
