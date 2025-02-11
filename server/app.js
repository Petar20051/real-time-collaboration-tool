
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


connectDB();


app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());



app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/user',userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/comments', commentRoutes);

const path = require('path');


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is ready for feature development!' });
});


socketHandler(server);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
