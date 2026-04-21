const { serializeDocument } = require('../lib/serializers');

function createValidatorService(repositories) {
  return {
    async getSettings() {
      const settings = await repositories.settings.findByScope('validator');
      return { settings: serializeDocument(settings) };
    },

    async updateSettings(body) {
      const updates = {
        autoRefresh: Boolean(body.autoRefresh),
        reviewLock: Boolean(body.reviewLock),
        quickCertificateMode: Boolean(body.quickCertificateMode),
      };

      const settings = await repositories.settings.updateByScope('validator', updates);
      return { settings: serializeDocument(settings) };
    },
  };
}

module.exports = {
  createValidatorService,
};
