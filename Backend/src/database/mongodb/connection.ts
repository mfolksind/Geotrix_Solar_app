import mongoose from 'mongoose';
import { env } from '../../config/env';
import logger from '../../common/logger/logger';

const mongoUri = env.MONGODB_URI;

export async function connectMongoDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  console.log("=================================");
  console.log("env.MONGODB_URI =", env.MONGODB_URI);
  console.log("process.env.MONGODB_URI =", process.env.MONGODB_URI);
  console.log("=================================");

  try {
    console.log(">>> Before mongoose.connect()");

    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGO_DB_NAME ?? 'geotrix',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(">>> After mongoose.connect()");
    logger.info("MongoDB connected");
  } catch (error) {
    console.error(">>> mongoose.connect() threw an error");
    logger.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
  } catch (error) {
    logger.error("Error during MongoDB disconnect", error);
  }
}