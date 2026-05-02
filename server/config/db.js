const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // If no valid MongoDB Atlas URI, use in-memory MongoDB
    if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
      console.log('⚡ No MongoDB Atlas URI found. Starting in-memory MongoDB...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`📦 In-memory MongoDB running at: ${uri}`);
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
