import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB connected`);
  } catch (error) {
    console.log("Connection failed");
    console.log(error.message);
    process.exit(1);
  }
};

export default connectDB;