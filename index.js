const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Initializes SQLite and creates tables
require('./config/db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  etag: true,
  lastModified: true,
  immutable: true
}));

app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/categories', require('./routes/categoryRoutes.js'));
app.use('/api/subservices', require('./routes/Subserviceroutes.js'));
app.use('/api/services', require('./routes/serviceRoutes.js'));
app.use('/api/vendors', require('./routes/vendorRoutes.js'));
app.use('/api/users',    require('./routes/userRoutes.js'));
app.use('/api/book', require('./routes/bookRoutes.js'));






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));