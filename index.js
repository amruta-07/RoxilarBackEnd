
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors'); // Import the cors middleware

const { initializeDatabase, getTransactions, getStatistics, getBarChartData } = require('./transactionController');
const Product = require('./productSchema');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URL;

app.use(cors());

// MongoDB connection
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// API endpoint to initialize the database with seed data
app.get('/initialize-database', async (req, res) => {
  const result = await initializeDatabase();
  res.json(result);
});

// API endpoint to list transactions with search, month, and pagination
app.get('/transactions', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const searchTitle = req.query.searchTitle || '';
  const month = req.query.month || '';

  const result = await getTransactions(page, perPage, month, searchTitle);

  res.json(result);
});

// API endpoint to get statistics for a specific month
app.get('/statistics', async (req, res) => {
  const month = req.query.month || '';

  // Require month parameter
  if (!month) {
    return res.status(400).json({ success: false, error: 'Month parameter is required' });
  }

  const result = await getStatistics(month);

  res.json(result);
});

// API endpoint to get bar chart data for a specific month
app.get('/bar-chart-data', async (req, res) => {
  const month = req.query.month || '';

  // Require month parameter
  if (!month) {
    return res.status(400).json({ success: false, error: 'Month parameter is required' });
  }

  const result = await getBarChartData(month);

  res.json(result);
});

// API endpoint to get pie chart data for a specific month
app.get('/combined-data', async (req, res) => {
  try {
    const month = req.query.month || '';

    // Require month parameter
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month parameter is required' });
    }

    // Fetch data from the transaction, statistics, and bar-chart APIs
    const transactions = await axios.get(`http://localhost:3000/transactions?month=${month}`);
    const statistics = await axios.get(`http://localhost:3000/statistics?month=${month}`);
    const barChartData = await axios.get(`http://localhost:3000/bar-chart-data?month=${month}`);

    // Combine responses
    const combinedData = {
      transactions: transactions.data,
      statistics: statistics.data,
      barChartData: barChartData.data,
    };

    res.json({ success: true, combinedData });
  } catch (error) {
    console.error('Error fetching combined data:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
