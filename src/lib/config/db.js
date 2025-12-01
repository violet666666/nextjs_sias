import mongoose from "mongoose";

export const ConnectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      console.log("Already connected to DB");
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("DB Connected Successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error("Failed to connect to database");
  }
};
