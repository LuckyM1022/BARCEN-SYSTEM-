function createDashboardService(repositories, syncService) {
  return {
    async getStats() {
      const [residentCount, completedSurveys, users] = await Promise.all([
        syncService.countCollection('residents'),
        syncService.countCollection('censusRecords'),
        repositories.users.findAll(),
      ]);
      const activeEnumerators = users.filter((user) => user.role === 'Census Taker').length;

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

export {
  createDashboardService,
};
