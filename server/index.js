import app from './app.js';

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`✅ EcoPower backend running on port ${PORT}`);
});
