// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const dbURI = process.env.DATABASE_URL; 

  if (!dbURI) {
    console.error('Error: No MongoDB connection string provided in process.env.DATABASE_URL');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(dbURI, {
      
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
