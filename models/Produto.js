import mongoose from "mongoose";

const ProdutoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  imagem: { type: String },
  preco: { type: Number, required: true },
  quantidade: { type: Number, required: true },
  fornecedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fornecedor",
    required: true,
  },
});

const Produto = mongoose.model("Produto", ProdutoSchema);
export default Produto;
