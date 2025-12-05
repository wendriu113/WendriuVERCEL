import mongoose from "mongoose";

const UsuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  perfil: { type: String, enum: ["admin", "usuario"], default: "usuario" },
  imagem: { type: String },
});

const Usuario = mongoose.model("Usuario", UsuarioSchema);
export default Usuario;
