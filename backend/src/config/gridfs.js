const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs;

// Initialize GridFS
const initGridFS = () => {
  const conn = mongoose.connection;
  
  conn.once('open', () => {
    // Initialize GridFS
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log('GridFS initialized successfully');
  });
};

// Get GridFS instance
const getGridFS = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized. Call initGridFS() first.');
  }
  return gfs;
};

module.exports = {
  initGridFS,
  getGridFS
};