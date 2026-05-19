const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = (process.env.MONGO_URI || process.env.MONGODB_URI);


    if (!uri || typeof uri !== "string") {
      throw new Error(
        "Missing MongoDB connection string. Set MONGO_URI (preferred) or MONGODB_URI in your environment/.env file."
      );
    }

    await mongoose.connect(uri);
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.log("MongoDB Connection Failed ❌");
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;