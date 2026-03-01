require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health — always first
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/auth',          require('./routes/auth'));
app.use('/api/klaviyo',   require('./routes/auth')); // /api/klaviyo/connect
app.use('/api/brand',     require('./routes/brand'));
app.use('/api/audit',     require('./routes/audit'));
app.use('/api/flows',     require('./routes/flows'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/templates', require('./routes/templates'));
// app.use('/api/billing', require('./routes/billing')); // Phase 13

// Error handler — always last
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(process.env.PORT || 3001, () => console.log('Mailo backend running on port ' + (process.env.PORT || 3001)));
