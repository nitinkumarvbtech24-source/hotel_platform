const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Hotel Platform Core API' });
});

// Future routes
// app.use('/api/customers', require('./routes/customerRoutes'));
// app.use('/api/iot', require('./routes/iotRoutes'));
// app.use('/api/payments', require('./routes/paymentRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
