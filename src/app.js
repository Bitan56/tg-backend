require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Dynamically reflect the request's origin back to allow any client
const corsOptions = {
  origin: (origin, callback) => {
    // Reflects incoming origin so credentials/cookies and any domain work seamlessly
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200, // Legacy browser compatibility (IE11)
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly across all routes
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ success: true, message: 'Ashram API is running' }));

// Ensure DB is connected before handling API requests (serverless-safe)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/v1/products', productRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[API Error]', err);

  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Each image must be 5MB or smaller',
      LIMIT_FILE_COUNT: 'You can upload a maximum of 8 images',
      LIMIT_UNEXPECTED_FILE: 'Only JPG, PNG or WebP images (field name "images") are allowed',
    };
    return res.status(400).json({ success: false, message: messages[err.code] || err.message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((e) => e.message).join(', '),
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
