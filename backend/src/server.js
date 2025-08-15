// src/server.js
const express = require('express');
const app = express();
const calorieRoutes = require('./routes/calorieRoutes');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use('/api/calories', calorieRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

// If Vercel imports this file we export a handler function.
// Locally we start a server.
if (process.env.VERCEL) {
  module.exports = (req, res) => app(req, res);
} else {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
