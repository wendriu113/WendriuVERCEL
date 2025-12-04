import mongoose from "mongoose";

const movimentacaoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ["entrada", "saida"],
  },
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Produto",
    required: true,
  },
  quantidade: {
    type: Number,
    required: true,
  },
  data: {
    type: Date,
    default: Date.now,
  },
  observacao: String,
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
});

const Movimentacao = mongoose.model("Movimentacao", movimentacaoSchema);
export default Movimentacao;
