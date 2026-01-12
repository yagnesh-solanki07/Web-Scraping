const specsonlineRoutes = require('./specsonline.routes');
const totalwineRoutes = require('./totalwine.routes');

const mainRoutes = (app) => {
  app.use('/api/specsonline', specsonlineRoutes);
  app.use('/api/totalwine', totalwineRoutes);
};

module.exports = mainRoutes;
