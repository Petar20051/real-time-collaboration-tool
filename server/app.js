
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const socketHandler = require('./socketHandler');
const documentRoutes = require('./routes/documentRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const commentRoutes=require('./routes/commentRoutes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Adjust the origin as needed
app.use(express.json());



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/user',userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/comments', commentRoutes);

const path = require('path');

// ✅ Serve static files (public access)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Placeholder route for future API endpoints
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is ready for feature development!' });
});

// Socket.IO setup
socketHandler(server);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
