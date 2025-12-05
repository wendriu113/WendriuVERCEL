import mongoose from "mongoose";

// URI de conexão (use a variável de ambiente MONGODB_URI em produção)
const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://wendriuborges:wendriu113@wendriutest.2emszso.mongodb.net/?appName=WendriuTEST";

// Opções de conexão: diminuir serverSelectionTimeoutMS para falhar rápido
// e desabilitar bufferCommands para evitar buffering em ambientes serverless
const options = {
  // useNewUrlParser/useUnifiedTopology são opcionais em Mongoose >=6
  serverSelectionTimeoutMS: 5000,
  bufferCommands: false,
};

// Cache global para evitar múltiplas conexões em ambientes serverless (Vercel, Netlify, Lambda)
// Guarda { conn, promise } em global._mongoose
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const conexao = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Connecting to database...");
    cached.promise = mongoose
      .connect(uri, options)
      .then((m) => {
        cached.conn = m.connection;
        console.log("Database connected successfully");
        return cached.conn;
      })
      .catch((error) => {
        console.error("Database connection error:", error);
        // reset promise to allow retries
        cached.promise = null;
        // Não chamar process.exit em ambientes serverless; repassar o erro
        throw error;
      });
  }

  return cached.promise;
};

export default conexao;
