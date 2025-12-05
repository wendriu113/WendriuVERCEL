import { createServer } from "http";

import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import conexao from "../config/conexao.js";
import Fornecedor from "../models/Fornecedor.js";
import Usuario from "../models/Usuario.js";
import Produto from "../models/Produto.js";
import Movimentacao from "../models/Movimentacao.js";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");

// Converte o caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set("views", join(__dirname, "../views"));
app.use(express.static(join(__dirname, "../public")));

//rotas
app.get("/", (req, res) => {
  res.render("index");
});

// Rotas Produto
app.get("/produto/lst", async (req, res) => {
  try {
    const produtos = await Produto.find()
      .populate("fornecedor")
      .sort({ nome: 1 })
      .lean();
    res.render("produto/lst", { produtos });
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    res.render("produto/lst", {
      produtos: [],
      error: "Erro ao listar produtos",
      showAlert: true,
      alertMessage: "Erro ao carregar lista de produtos: " + err.message,
    });
  }
});

app.get("/produto/add", async (req, res) => {
  try {
    const fornecedores = await Fornecedor.find().lean();
    res.render("produto/add", {
      formData: {},
      fornecedores,
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar formulário:", err);
    res.render("produto/add", {
      formData: {},
      fornecedores: [],
      error: "Erro ao carregar fornecedores",
      showAlert: true,
      alertMessage: "Erro ao carregar lista de fornecedores: " + err.message,
    });
  }
});

app.post("/produto/add/ok", async (req, res) => {
  try {
    if (
      !req.body.nome ||
      !req.body.preco ||
      !req.body.quantidade ||
      !req.body.fornecedor
    ) {
      throw new Error("Todos os campos obrigatórios devem ser preenchidos");
    }

    const produto = await Produto.create({
      nome: req.body.nome,
      descricao: req.body.descricao || "",
      preco: Number(req.body.preco),
      quantidade: Number(req.body.quantidade),
      fornecedor: req.body.fornecedor,
    });

    const produtoPopulado = await produto.populate("fornecedor");
    return res.render("produto/addok", { produto: produtoPopulado });
  } catch (err) {
    console.error("Erro ao salvar produto:", err);

    // Recarrega fornecedores para o form
    const fornecedores = await Fornecedor.find().lean();

    return res.status(400).render("produto/add", {
      error: "Erro ao salvar produto",
      formData: req.body,
      fornecedores,
      showAlert: true,
      alertMessage: "Erro ao salvar produto: " + err.message,
    });
  }
});

app.post("/produto/delete/:id", async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.redirect("/produto/lst");
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    res.redirect("/produto/lst");
  }
});

// Rota GET para editar produto
app.get("/produto/edit/:id", async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id)
      .populate("fornecedor")
      .lean();
    const fornecedores = await Fornecedor.find().sort({ nome: 1 }).lean();

    if (!produto) {
      throw new Error("Produto não encontrado");
    }

    res.render("produto/edit", {
      formData: produto,
      fornecedores,
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar produto:", err);
    res.redirect("/produto/lst");
  }
});

// Rota POST para salvar edição do produto
app.post("/produto/edit/:id", async (req, res) => {
  try {
    await Produto.findByIdAndUpdate(req.params.id, {
      nome: req.body.nome,
      descricao: req.body.descricao,
      preco: Number(req.body.preco),
      quantidade: Number(req.body.quantidade),
      fornecedor: req.body.fornecedor,
    });

    res.redirect("/produto/lst");
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    const fornecedores = await Fornecedor.find().lean();
    res.render("produto/edit", {
      formData: req.body,
      fornecedores,
      error: "Erro ao atualizar produto",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

// Rotas Movimentação
app.get("/movimentacao/lst", async (req, res) => {
  try {
    const movimentacoes = await Movimentacao.find()
      .populate("produto")
      .populate("usuario")
      .sort({ data: -1 })
      .lean();

    res.render("movimentacao/lst", { movimentacoes });
  } catch (err) {
    console.error("Erro ao listar movimentações:", err);
    res.render("movimentacao/lst", {
      movimentacoes: [],
      error: "Erro ao listar movimentações",
    });
  }
});

// Rota GET para adicionar movimentação
app.get("/movimentacao/add", async (req, res) => {
  try {
    const produtos = await Produto.find().lean();
    const fornecedores = await Fornecedor.find().lean();
    const usuarios = await Usuario.find().select("-senha").lean();

    res.render("movimentacao/add", {
      formData: {},
      produtos,
      fornecedores,
      usuarios, // Passa usuários para o template
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar formulário:", err);
    res.render("movimentacao/add", {
      formData: {},
      produtos: [],
      fornecedores: [],
      usuarios: [], // Array vazio em caso de erro
      error: "Erro ao carregar dados",
    });
  }
});

// Rota POST para salvar movimentação
app.post("/movimentacao/add/ok", async (req, res) => {
  try {
    const movimentacao = new Movimentacao({
      ...req.body,
      data: new Date(),
    });

    await movimentacao.save();
    res.redirect("/movimentacao/lst");
  } catch (err) {
    console.error("Erro ao salvar movimentação:", err);
    const produtos = await Produto.find().lean();
    const fornecedores = await Fornecedor.find().lean();
    const usuarios = await Usuario.find().select("-senha").lean(); // Adiciona busca de usuários

    res.render("movimentacao/add", {
      formData: req.body,
      produtos,
      fornecedores,
      usuarios, // Passa usuários para o template
      error: "Erro ao salvar movimentação",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

app.post("/movimentacao/delete/:id", async (req, res) => {
  try {
    await Movimentacao.findByIdAndDelete(req.params.id);
    res.redirect("/movimentacao/lst");
  } catch (err) {
    console.error("Erro ao excluir movimentação:", err);
    res.redirect("/movimentacao/lst");
  }
});

// Rota GET para editar movimentação
app.get("/movimentacao/edit/:id", async (req, res) => {
  try {
    const movimentacao = await Movimentacao.findById(req.params.id)
      .populate("produto")
      .populate("usuario")
      .lean();

    const produtos = await Produto.find().lean();
    const usuarios = await Usuario.find().select("-senha").lean(); // Adiciona busca de usuários

    if (!movimentacao) {
      throw new Error("Movimentação não encontrada");
    }

    res.render("movimentacao/edit", {
      formData: movimentacao,
      produtos,
      usuarios, // Passa usuários para o template
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar movimentação:", err);
    res.redirect("/movimentacao/lst");
  }
});

// Rota POST para salvar edição da movimentação
app.post("/movimentacao/edit/:id", async (req, res) => {
  try {
    const movimentacao = await Movimentacao.findById(req.params.id);
    if (!movimentacao) {
      throw new Error("Movimentação não encontrada");
    }

    // Busca produto atual e novo produto
    const produtoAtual = await Produto.findById(movimentacao.produto);
    const produtoNovo = await Produto.findById(req.body.produto);

    if (!produtoAtual || !produtoNovo) {
      throw new Error("Produto não encontrado");
    }

    // Reverte quantidade da movimentação anterior
    if (movimentacao.tipo === "entrada") {
      produtoAtual.quantidade -= movimentacao.quantidade;
    } else {
      produtoAtual.quantidade += movimentacao.quantidade;
    }
    await produtoAtual.save();

    // Se mudou de produto, atualiza o novo
    if (produtoNovo._id.toString() !== produtoAtual._id.toString()) {
      // Aplica quantidade no novo produto
      if (req.body.tipo === "entrada") {
        produtoNovo.quantidade += Number(req.body.quantidade);
      } else {
        if (produtoNovo.quantidade < Number(req.body.quantidade)) {
          throw new Error("Quantidade insuficiente em estoque");
        }
        produtoNovo.quantidade -= Number(req.body.quantidade);
      }
      await produtoNovo.save();
    } else {
      // Mesmo produto, apenas atualiza quantidade
      if (req.body.tipo === "entrada") {
        produtoAtual.quantidade += Number(req.body.quantidade);
      } else {
        if (produtoAtual.quantidade < Number(req.body.quantidade)) {
          throw new Error("Quantidade insuficiente em estoque");
        }
        produtoAtual.quantidade -= Number(req.body.quantidade);
      }
      await produtoAtual.save();
    }

    // Atualiza movimentação
    movimentacao.tipo = req.body.tipo;
    movimentacao.produto = req.body.produto;
    movimentacao.quantidade = Number(req.body.quantidade);
    movimentacao.usuario = req.body.usuario; // Adiciona atualização do usuário
    movimentacao.observacao = req.body.observacao;
    await movimentacao.save();

    res.redirect("/movimentacao/lst");
  } catch (err) {
    console.error("Erro ao atualizar movimentação:", err);
    const produtos = await Produto.find().lean();
    const usuarios = await Usuario.find().select("-senha").lean(); // Adiciona busca de usuários
    res.render("movimentacao/edit", {
      formData: { ...req.body, _id: req.params.id },
      produtos,
      usuarios, // Passa usuários para o template
      error: "Erro ao atualizar movimentação",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

// Rotas Usuário
app.get("/usuario/lst", async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select("-senha")
      .sort({ nome: 1 })
      .lean();
    res.render("usuario/lst", { usuarios });
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.render("usuario/lst", {
      usuarios: [],
      error: "Erro ao listar usuários",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

app.get("/usuario/add", (req, res) => {
  res.render("usuario/add", { formData: {}, error: null });
});

app.post("/usuario/add/ok", async (req, res) => {
  try {
    if (!req.body.nome || !req.body.email || !req.body.senha) {
      throw new Error("Nome, email e senha são obrigatórios");
    }

    const usuario = await Usuario.create({
      nome: req.body.nome,
      email: req.body.email,
      senha: req.body.senha,
      perfil: req.body.perfil || "usuario",
    });

    const usuarioSemSenha = { ...usuario.toObject(), senha: undefined };
    return res.render("usuario/addok", { usuario: usuarioSemSenha });
  } catch (err) {
    console.error("Erro ao salvar usuário:", err);
    let message = "Erro ao salvar usuário";
    if (err.code === 11000) message = "Email já cadastrado";
    return res.status(400).render("usuario/add", {
      error: message,
      formData: req.body,
      showAlert: true,
      alertMessage: `${message}: ${err.message}`,
    });
  }
});

app.post("/usuario/delete/:id", async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
  }
  return res.redirect("/usuario/lst");
});

// Rota para form de edição
app.get("/usuario/edit/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .select("-senha")
      .lean();
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }
    res.render("usuario/edit", { formData: usuario, error: null });
  } catch (err) {
    console.error("Erro ao carregar usuário:", err);
    res.redirect("/usuario/lst");
  }
});

// Rota POST para salvar edição
app.post("/usuario/edit/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    usuario.nome = req.body.nome;
    usuario.email = req.body.email;
    usuario.perfil = req.body.perfil;

    // Só atualiza a senha se foi fornecida uma nova
    if (req.body.senha && req.body.senha.trim() !== "") {
      usuario.senha = req.body.senha;
    }

    await usuario.save();
    res.redirect("/usuario/lst");
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.render("usuario/edit", {
      formData: { ...req.body, _id: req.params.id },
      error: "Erro ao atualizar usuário",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

// Rotas Fornecedor
app.get("/fornecedor/lst", async (req, res) => {
  try {
    const fornecedores = await Fornecedor.find().sort({ nome: 1 }).lean();
    res.render("fornecedor/lst", { fornecedores });
  } catch (err) {
    console.error("Erro ao listar fornecedores:", err);
    res.render("fornecedor/lst", {
      fornecedores: [],
      error: "Erro ao listar fornecedores",
    });
  }
});

app.get("/fornecedor/add", (req, res) => {
  res.render("fornecedor/add", { formData: {}, error: null });
});

app.post("/fornecedor/add/ok", async (req, res) => {
  try {
    const fornecedor = await Fornecedor.create({
      nome: req.body.nome,
      cnpj: req.body.cnpj.replace(/\D/g, ""),
      endereco: req.body.endereco,
      telefone: req.body.telefone.replace(/\D/g, ""),
      email: req.body.email,
    });

    res.render("fornecedor/addok", { fornecedor });
  } catch (err) {
    console.error("Erro ao salvar fornecedor:", err);
    let alertMessage = "Erro ao salvar fornecedor";

    if (err.code === 11000) {
      alertMessage = "Este CNPJ já está cadastrado no sistema";
    } else if (err.name === "ValidationError") {
      alertMessage =
        "Dados inválidos: " +
        Object.values(err.errors)
          .map((e) => e.message)
          .join(", ");
    }

    res.status(400).render("fornecedor/add", {
      error: alertMessage,
      formData: req.body,
      showAlert: true,
      alertMessage,
    });
  }
});

app.post("/fornecedor/delete/:id", async (req, res) => {
  try {
    await Fornecedor.findByIdAndDelete(req.params.id);
    res.redirect("/fornecedor/lst");
  } catch (err) {
    console.error("Erro ao editar fornecedor:", err);
    res.redirect("/fornecedor/lst");
  }
});

// Rota GET para form de edição
app.get("/fornecedor/edit/:id", async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findById(req.params.id).lean();
    if (!fornecedor) {
      throw new Error("Fornecedor não encontrado");
    }
    res.render("fornecedor/edit", { formData: fornecedor, error: null });
  } catch (err) {
    console.error("Erro ao carregar fornecedor:", err);
    res.redirect("/fornecedor/lst");
  }
});

// Rota POST para salvar edição
app.post("/fornecedor/edit/:id", async (req, res) => {
  try {
    await Fornecedor.findByIdAndUpdate(req.params.id, {
      nome: req.body.nome,
      cnpj: req.body.cnpj.replace(/\D/g, ""),
      telefone: req.body.telefone.replace(/\D/g, ""),
      email: req.body.email,
      endereco: req.body.endereco,
    });

    res.redirect("/fornecedor/lst");
  } catch (err) {
    console.error("Erro ao atualizar fornecedor:", err);
    res.render("fornecedor/edit", {
      formData: req.body,
      error: "Erro ao atualizar fornecedor",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

export default app;

// Iniciar servidor apenas se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3001;
  await conexao();

  const server = app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Porta ${PORT} já está em uso. Pare o processo que está usando a porta ou escolha outra porta.`
      );
      process.exit(1);
    }
    throw err;
  });
}

// validação de CNPJ (algoritmo padrão)
function validateCNPJ(input) {
  const cnpj = (input || "").replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calc = (t) => {
    const size = t.length - 2;
    const nums = t.substring(0, size).split("").map(Number);
    const pos = size - 7;
    let sum = 0;
    for (let i = size; i >= 1; i--) {
      sum += nums[size - i] * (i + pos);
    }
    let res = sum % 11;
    return res < 2 ? 0 : 11 - res;
  };

  const t1 = cnpj.substring(0, 12) + calc(cnpj.substring(0, 12));
  const t2 = cnpj.substring(0, 13) + calc(cnpj.substring(0, 13));
  return t1 === cnpj.substring(0, 13) + cnpj[12] ? true : t2 === cnpj;
}
