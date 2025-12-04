import mongoose from "mongoose";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://wendriuborges:wendriu113@wendriutest.2emszso.mongodb.net/?appName=WendriuTEST";

const conexao = async () => {
  console.log("Connecting to database...");
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default conexao;
