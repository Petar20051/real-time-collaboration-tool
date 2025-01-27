
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const socketHandler = require('./socketHandler'); 


const app = express();
const server = http.createServer(app);


connectDB();

app.use(cors({ origin: 'http://localhost:3000' })); 
app.use(express.json());
app.use('/api/auth', authRoutes);


app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is ready for feature development!' });
});


socketHandler(server); 


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

cd
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
