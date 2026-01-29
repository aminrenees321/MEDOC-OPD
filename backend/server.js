const connectDB = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`OPD Token Allocation Engine listening on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
