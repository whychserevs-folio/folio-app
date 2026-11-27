// Local-dev helper: when FOLIO_EXPO_GO=1, drop the EAS projectId so Expo Go
// can open the project without signing in to the owner's Expo account.
// Normal starts and EAS builds use app.json unchanged.
module.exports = ({ config }) => {
  if (process.env.FOLIO_EXPO_GO !== '1') return config;
  const { eas, ...extra } = config.extra || {};
  return { ...config, extra };
};
