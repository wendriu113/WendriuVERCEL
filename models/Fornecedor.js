import conexao  from "../config/conexao.js";
import mongoose from "mongoose";

const FornecedorSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cnpj: { type: String, required: true, unique: true },
  endereco: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, required: true },
});

const Fornecedor = mongoose.model("Fornecedor", FornecedorSchema);

export default Fornecedor;
