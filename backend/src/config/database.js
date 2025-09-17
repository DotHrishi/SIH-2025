const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize GridFS
    gfs = Grid(conn.connection.db, mongoose.mongo);
    gfs.collection('uploads');
    
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const getGFS = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized. Make sure to call connectDB first.');
  }
  return gfs;
};

module.exports = {
  connectDB,
  getGFS
};