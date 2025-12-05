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

// Middleware para garantir que a conexão com o banco esteja estabelecida
// antes de processar qualquer rota. Isso evita buffering/timeouts quando
// uma requisição chega antes da conexão estar pronta (útil em serverless).
app.use(async (req, res, next) => {
  try {
    await conexao();
    return next();
  } catch (err) {
    console.error("Erro na conexão antes de processar a rota:", err);
    return res.status(500).send("Erro ao conectar ao banco de dados");
  }
});

// Converte o caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set("views", join(__dirname, "../views"));
app.use(express.static(join(__dirname, "../public")));

//rotas
app.get("/", (req, res) => {
  // Passar ícones simples para o template (pode trocar por SVG/HTML se preferir)
  const packageIcon = "📦";
  const arrowIcon = "➡️";
  res.render("site/site", { packageIcon, arrowIcon });
});

// Página pública de produtos (site)
app.get("/site/produtosite", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let produtos;
    if (q) {
      const regex = new RegExp(q, "i");
      const fornecedoresMatch = await Fornecedor.find({ nome: regex })
        .select("_id")
        .lean();
      const fornecedorIds = fornecedoresMatch.map((f) => f._id);
      const or = [{ nome: regex }, { descricao: regex }];
      if (fornecedorIds.length) or.push({ fornecedor: { $in: fornecedorIds } });
      produtos = await Produto.find({ $or: or })
        .populate("fornecedor")
        .sort({ nome: 1 })
        .lean();
    } else {
      produtos = await Produto.find()
        .populate("fornecedor")
        .sort({ nome: 1 })
        .lean();
    }
    res.render("site/produtosite", { produtos, q });
  } catch (err) {
    console.error("Erro ao carregar produtos do site:", err);
    res.status(500).render("site/produtosite", {
      produtos: [],
      q,
      showAlert: true,
      alertMessage: "Erro ao carregar produtos: " + err.message,
    });
  }
});

// Rota compatibilidade: /produtosite -> /site/produtosite
app.get("/produtosite", (req, res) => {
  return res.redirect(301, "/site/produtosite");
});

// Página pública de fornecedores (site)
app.get("/site/fornecedorsite", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let fornecedores;
    if (q) {
      const regex = new RegExp(q, "i");
      fornecedores = await Fornecedor.find({ nome: regex })
        .sort({ nome: 1 })
        .lean();
    } else {
      fornecedores = await Fornecedor.find().sort({ nome: 1 }).lean();
    }
    res.render("site/fornecedorsite", { fornecedores, q });
  } catch (err) {
    console.error("Erro ao carregar fornecedores do site:", err);
    res.status(500).render("site/fornecedorsite", {
      fornecedores: [],
      q,
      showAlert: true,
      alertMessage: "Erro ao carregar fornecedores: " + err.message,
    });
  }
});

// Compatibilidade /fornecedorsite -> /site/fornecedorsite
app.get("/fornecedorsite", (req, res) =>
  res.redirect(301, "/site/fornecedorsite")
);

// Página pública de movimentações (site)
app.get("/site/movimentacaosite", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let movimentacoes;
    if (q) {
      const regex = new RegExp(q, "i");
      const produtosMatch = await Produto.find({ nome: regex })
        .select("_id")
        .lean();
      const produtoIds = produtosMatch.map((p) => p._id);
      const usuariosMatch = await Usuario.find({ nome: regex })
        .select("_id")
        .lean();
      const usuarioIds = usuariosMatch.map((u) => u._id);
      const or = [{ observacao: regex }];
      if (produtoIds.length) or.push({ produto: { $in: produtoIds } });
      if (usuarioIds.length) or.push({ usuario: { $in: usuarioIds } });
      movimentacoes = await Movimentacao.find({ $or: or })
        .populate("produto")
        .populate("usuario")
        .sort({ data: -1 })
        .lean();
    } else {
      movimentacoes = await Movimentacao.find()
        .populate("produto")
        .populate("usuario")
        .sort({ data: -1 })
        .lean();
    }
    res.render("site/movimentacaosite", { movimentacoes, q });
  } catch (err) {
    console.error("Erro ao carregar movimentações do site:", err);
    res.status(500).render("site/movimentacaosite", {
      movimentacoes: [],
      q,
      showAlert: true,
      alertMessage: "Erro ao carregar movimentações: " + err.message,
    });
  }
});

// Compatibilidade /movimentacaosite -> /site/movimentacaosite
app.get("/movimentacaosite", (req, res) =>
  res.redirect(301, "/site/movimentacaosite")
);

// Página pública de usuários (site)
app.get("/site/usuariosite", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let usuarios;
    if (q) {
      const regex = new RegExp(q, "i");
      usuarios = await Usuario.find({ nome: regex })
        .select("-senha")
        .sort({ nome: 1 })
        .lean();
    } else {
      usuarios = await Usuario.find().select("-senha").sort({ nome: 1 }).lean();
    }
    res.render("site/usuariosite", { usuarios, q });
  } catch (err) {
    console.error("Erro ao carregar usuários do site:", err);
    res.status(500).render("site/usuariosite", {
      usuarios: [],
      q,
      showAlert: true,
      alertMessage: "Erro ao carregar usuários: " + err.message,
    });
  }
});

// Compatibilidade /usuariosite -> /site/usuariosite
app.get("/usuariosite", (req, res) => res.redirect(301, "/site/usuariosite"));

// Rotas Produto
app.get("/produtoadm/lst", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let produtos;
    if (q) {
      const regex = new RegExp(q, "i");
      const fornecedoresMatch = await Fornecedor.find({ nome: regex })
        .select("_id")
        .lean();
      const fornecedorIds = fornecedoresMatch.map((f) => f._id);
      const or = [{ nome: regex }, { descricao: regex }];
      if (fornecedorIds.length) or.push({ fornecedor: { $in: fornecedorIds } });
      produtos = await Produto.find({ $or: or })
        .populate("fornecedor")
        .sort({ nome: 1 })
        .lean();
    } else {
      produtos = await Produto.find()
        .populate("fornecedor")
        .sort({ nome: 1 })
        .lean();
    }
    res.render("produtoadm/lst", { produtos, q });
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    res.render("produtoadm/lst", {
      produtos: [],
      q,
      error: "Erro ao listar produtos",
      showAlert: true,
      alertMessage: "Erro ao carregar lista de produtos: " + err.message,
    });
  }
});

app.get("/produtoadm/add", async (req, res) => {
  try {
    const fornecedores = await Fornecedor.find().lean();
    res.render("produtoadm/add", {
      formData: {},
      fornecedores,
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar formulário:", err);
    res.render("produtoadm/add", {
      formData: {},
      fornecedores: [],
      error: "Erro ao carregar fornecedores",
      showAlert: true,
      alertMessage: "Erro ao carregar lista de fornecedores: " + err.message,
    });
  }
});

app.post("/produtoadm/add/ok", async (req, res) => {
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
      imagem: req.body.imagem || "",
      preco: Number(req.body.preco),
      quantidade: Number(req.body.quantidade),
      fornecedor: req.body.fornecedor,
    });

    const produtoPopulado = await produto.populate("fornecedor");
    return res.render("produtoadm/addok", { produto: produtoPopulado });
  } catch (err) {
    console.error("Erro ao salvar produto:", err);

    // Recarrega fornecedores para o form
    const fornecedores = await Fornecedor.find().lean();

    return res.status(400).render("produtoadm/add", {
      error: "Erro ao salvar produto",
      formData: req.body,
      fornecedores,
      showAlert: true,
      alertMessage: "Erro ao salvar produto: " + err.message,
    });
  }
});

app.post("/produtoadm/delete/:id", async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.redirect("/produtoadm/lst");
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    res.redirect("/produtoadm/lst");
  }
});

// Rota GET para editar produto
app.get("/produtoadm/edit/:id", async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id)
      .populate("fornecedor")
      .lean();
    const fornecedores = await Fornecedor.find().sort({ nome: 1 }).lean();

    if (!produto) {
      throw new Error("Produto não encontrado");
    }

    res.render("produtoadm/edit", {
      formData: produto,
      fornecedores,
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar produto:", err);
    res.redirect("/produtoadm/lst");
  }
});

// Rota POST para salvar edição do produto
app.post("/produtoadm/edit/:id", async (req, res) => {
  try {
    await Produto.findByIdAndUpdate(req.params.id, {
      nome: req.body.nome,
      descricao: req.body.descricao,
      imagem: req.body.imagem || "",
      preco: Number(req.body.preco),
      quantidade: Number(req.body.quantidade),
      fornecedor: req.body.fornecedor,
    });

    res.redirect("/produtoadm/lst");
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    const fornecedores = await Fornecedor.find().lean();
    res.render("produtoadm/edit", {
      formData: req.body,
      fornecedores,
      error: "Erro ao atualizar produto",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

// Rotas Movimentação
app.get("/movimentacaoadm/lst", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let movimentacoes;
    if (q) {
      const regex = new RegExp(q, "i");
      const produtosMatch = await Produto.find({ nome: regex })
        .select("_id")
        .lean();
      const produtoIds = produtosMatch.map((p) => p._id);
      const usuariosMatch = await Usuario.find({ nome: regex })
        .select("_id")
        .lean();
      const usuarioIds = usuariosMatch.map((u) => u._id);
      const or = [{ observacao: regex }];
      if (produtoIds.length) or.push({ produto: { $in: produtoIds } });
      if (usuarioIds.length) or.push({ usuario: { $in: usuarioIds } });
      movimentacoes = await Movimentacao.find({ $or: or })
        .populate("produto")
        .populate("usuario")
        .sort({ data: -1 })
        .lean();
    } else {
      movimentacoes = await Movimentacao.find()
        .populate("produto")
        .populate("usuario")
        .sort({ data: -1 })
        .lean();
    }

    res.render("movimentacaoadm/lst", { movimentacoes, q });
  } catch (err) {
    console.error("Erro ao listar movimentações:", err);
    res.render("movimentacaoadm/lst", {
      movimentacoes: [],
      q,
      error: "Erro ao listar movimentações",
    });
  }
});

// Rota GET para adicionar movimentação
app.get("/movimentacaoadm/add", async (req, res) => {
  try {
    const produtos = await Produto.find().lean();
    const fornecedores = await Fornecedor.find().lean();
    const usuarios = await Usuario.find().select("-senha").lean();

    res.render("movimentacaoadm/add", {
      formData: {},
      produtos,
      fornecedores,
      usuarios, // Passa usuários para o template
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar formulário:", err);
    res.render("movimentacaoadm/add", {
      formData: {},
      produtos: [],
      fornecedores: [],
      usuarios: [], // Array vazio em caso de erro
      error: "Erro ao carregar dados",
    });
  }
});

// Rota POST para salvar movimentação
app.post("/movimentacaoadm/add/ok", async (req, res) => {
  try {
    const movimentacao = new Movimentacao({
      ...req.body,
      data: new Date(),
    });

    await movimentacao.save();
    res.redirect("/movimentacaoadm/lst");
  } catch (err) {
    console.error("Erro ao salvar movimentação:", err);
    const produtos = await Produto.find().lean();
    const fornecedores = await Fornecedor.find().lean();
    const usuarios = await Usuario.find().select("-senha").lean(); // Adiciona busca de usuários

    res.render("movimentacaoadm/add", {
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

app.post("/movimentacaoadm/delete/:id", async (req, res) => {
  try {
    await Movimentacao.findByIdAndDelete(req.params.id);
    res.redirect("/movimentacaoadm/lst");
  } catch (err) {
    console.error("Erro ao excluir movimentação:", err);
    res.redirect("/movimentacaoadm/lst");
  }
});

// Rota GET para editar movimentação
app.get("/movimentacaoadm/edit/:id", async (req, res) => {
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

    res.render("movimentacaoadm/edit", {
      formData: movimentacao,
      produtos,
      usuarios, // Passa usuários para o template
      error: null,
    });
  } catch (err) {
    console.error("Erro ao carregar movimentação:", err);
    res.redirect("/movimentacaoadm/lst");
  }
});

// Rota POST para salvar edição da movimentação
app.post("/movimentacaoadm/edit/:id", async (req, res) => {
  try {
    console.log("[MOVIMENTACAO EDIT] received", {
      params: req.params,
      body: req.body,
    });

    const movimentacao = await Movimentacao.findById(req.params.id);
    console.log(
      "[MOVIMENTACAO EDIT] loaded movimentacao id:",
      movimentacao ? movimentacao._id : null
    );
    if (!movimentacao) throw new Error("Movimentação não encontrada");

    // Busca produto atual (da movimentação). Se estiver ausente no documento,
    // tenta recuperar usando o produto enviado no formulário.
    let produtoAtual = null;
    const originalProdutoId = movimentacao.produto;
    if (originalProdutoId) {
      produtoAtual = await Produto.findById(originalProdutoId);
    }
    console.log(
      "[MOVIMENTACAO EDIT] produtoAtual (do documento):",
      produtoAtual
        ? { id: produtoAtual._id, quantidade: produtoAtual.quantidade }
        : null
    );

    // Tenta buscar o novo produto vindo do form
    let produtoNovo = null;
    if (req.body && req.body.produto) {
      produtoNovo = await Produto.findById(req.body.produto);
    }
    console.log(
      "[MOVIMENTACAO EDIT] produtoNovo (do form):",
      produtoNovo
        ? { id: produtoNovo._id, quantidade: produtoNovo.quantidade }
        : null
    );

    // Se não existe produtoAtual no documento, mas o form trouxe um produto válido,
    // assumimos que não há quantidade anterior a ser revertida (registro inconsistente).
    const hasOriginalProduto = !!produtoAtual;
    if (!produtoAtual && produtoNovo) {
      console.warn(
        "[MOVIMENTACAO EDIT] produtoAtual ausente no documento; assume produtoNovo como atual (sem revert)"
      );
      produtoAtual = produtoNovo;
    }

    if (!produtoAtual)
      throw new Error("Produto atual (da movimentação) não encontrado");

    // Reverte quantidade da movimentação anterior apenas se havia produto original
    if (hasOriginalProduto) {
      if (movimentacao.tipo === "entrada")
        produtoAtual.quantidade -= movimentacao.quantidade;
      else produtoAtual.quantidade += movimentacao.quantidade;
      await produtoAtual.save();
      console.log(
        "[MOVIMENTACAO EDIT] produtoAtual depois do revert:",
        produtoAtual.quantidade
      );
    } else {
      console.log(
        "[MOVIMENTACAO EDIT] pulando revert (nenhum produto original encontrado)"
      );
    }

    // Se mudou de produto, atualiza o novo
    if (produtoNovo._id.toString() !== produtoAtual._id.toString()) {
      if (req.body.tipo === "entrada")
        produtoNovo.quantidade += Number(req.body.quantidade);
      else {
        if (produtoNovo.quantidade < Number(req.body.quantidade))
          throw new Error("Quantidade insuficiente em estoque");
        produtoNovo.quantidade -= Number(req.body.quantidade);
      }
      await produtoNovo.save();
      console.log(
        "[MOVIMENTACAO EDIT] produtoNovo salvo, quantidade:",
        produtoNovo.quantidade
      );
    } else {
      // Mesmo produto, apenas atualiza quantidade
      if (req.body.tipo === "entrada")
        produtoAtual.quantidade += Number(req.body.quantidade);
      else {
        if (produtoAtual.quantidade < Number(req.body.quantidade))
          throw new Error("Quantidade insuficiente em estoque");
        produtoAtual.quantidade -= Number(req.body.quantidade);
      }
      await produtoAtual.save();
      console.log(
        "[MOVIMENTACAO EDIT] produtoAtual atualizado, quantidade:",
        produtoAtual.quantidade
      );
    }

    // Atualiza movimentação
    movimentacao.tipo = req.body.tipo;
    movimentacao.produto = req.body.produto || movimentacao.produto;
    movimentacao.quantidade = Number(req.body.quantidade);
    movimentacao.usuario = req.body.usuario || movimentacao.usuario;
    movimentacao.observacao = req.body.observacao;
    await movimentacao.save();
    console.log("[MOVIMENTACAO EDIT] movimentacao salva id:", movimentacao._id);

    return res.redirect("/movimentacaoadm/lst");
  } catch (err) {
    console.error("Erro ao atualizar movimentação:", err);
    const produtos = await Produto.find().lean();
    const usuarios = await Usuario.find().select("-senha").lean();
    return res.render("movimentacaoadm/edit", {
      formData: { ...req.body, _id: req.params.id },
      produtos,
      usuarios,
      error: "Erro ao atualizar movimentação",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

// Rotas Usuário
app.get("/usuarioadm/lst", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let usuarios;
    if (q) {
      const regex = new RegExp(q, "i");
      usuarios = await Usuario.find({
        $or: [{ nome: regex }, { email: regex }],
      })
        .select("-senha")
        .sort({ nome: 1 })
        .lean();
    } else {
      usuarios = await Usuario.find().select("-senha").sort({ nome: 1 }).lean();
    }
    res.render("usuarioadm/lst", { usuarios, q });
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.render("usuarioadm/lst", {
      usuarios: [],
      q,
      error: "Erro ao listar usuários",
      showAlert: true,
      alertMessage: "Erro ao carregar lista de usuários: " + err.message,
    });
  }
});

app.get("/usuarioadm/add", (req, res) => {
  res.render("usuarioadm/add", { formData: {}, error: null });
});

app.post("/usuarioadm/add/ok", async (req, res) => {
  try {
    if (!req.body.nome || !req.body.email || !req.body.senha) {
      throw new Error("Nome, email e senha são obrigatórios");
    }

    const usuario = await Usuario.create({
      nome: req.body.nome,
      email: req.body.email,
      senha: req.body.senha,
      perfil: req.body.perfil || "usuario",
      imagem: req.body.imagem || undefined,
    });

    const usuarioSemSenha = { ...usuario.toObject(), senha: undefined };
    return res.render("usuarioadm/addok", { usuario: usuarioSemSenha });
  } catch (err) {
    console.error("Erro ao salvar usuário:", err);
    let message = "Erro ao salvar usuário";
    if (err.code === 11000) message = "Email já cadastrado";
    return res.status(400).render("usuarioadm/add", {
      error: message,
      formData: req.body,
      showAlert: true,
      alertMessage: `${message}: ${err.message}`,
    });
  }
});

app.post("/usuarioadm/delete/:id", async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
  }
  return res.redirect("/usuarioadm/lst");
});

// Rota para form de edição
app.get("/usuarioadm/edit/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .select("-senha")
      .lean();
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }
    res.render("usuarioadm/edit", { formData: usuario, error: null });
  } catch (err) {
    console.error("Erro ao carregar usuário:", err);
    res.redirect("/usuarioadm/lst");
  }
});

// Rota POST para salvar edição
app.post("/usuarioadm/edit/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    usuario.nome = req.body.nome;
    usuario.email = req.body.email;
    usuario.perfil = req.body.perfil;
    usuario.imagem = req.body.imagem || undefined;

    // Só atualiza a senha se foi fornecida uma nova
    if (req.body.senha && req.body.senha.trim() !== "") {
      usuario.senha = req.body.senha;
    }

    await usuario.save();
    res.redirect("/usuarioadm/lst");
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.render("usuarioadm/edit", {
      formData: { ...req.body, _id: req.params.id },
      error: "Erro ao atualizar usuário",
      showAlert: true,
      alertMessage: err.message,
    });
  }
});

// Rotas Fornecedor
app.get("/fornecedoradm/lst", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    let fornecedores;
    if (q) {
      const regex = new RegExp(q, "i");
      fornecedores = await Fornecedor.find({
        $or: [{ nome: regex }, { cnpj: regex }],
      })
        .sort({ nome: 1 })
        .lean();
    } else {
      fornecedores = await Fornecedor.find().sort({ nome: 1 }).lean();
    }
    res.render("fornecedoradm/lst", { fornecedores, q });
  } catch (err) {
    console.error("Erro ao listar fornecedores:", err);
    res.render("fornecedoradm/lst", {
      fornecedores: [],
      q,
      error: "Erro ao listar fornecedores",
    });
  }
});

app.get("/fornecedoradm/add", (req, res) => {
  res.render("fornecedoradm/add", { formData: {}, error: null });
});

app.post("/fornecedoradm/add/ok", async (req, res) => {
  try {
    const fornecedor = await Fornecedor.create({
      nome: req.body.nome,
      cnpj: req.body.cnpj.replace(/\D/g, ""),
      endereco: req.body.endereco,
      telefone: req.body.telefone.replace(/\D/g, ""),
      email: req.body.email,
      imagem: req.body.imagem || undefined,
    });

    res.render("fornecedoradm/addok", { fornecedor });
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

    res.status(400).render("fornecedoradm/add", {
      error: alertMessage,
      formData: req.body,
      showAlert: true,
      alertMessage,
    });
  }
});

app.post("/fornecedoradm/delete/:id", async (req, res) => {
  try {
    await Fornecedor.findByIdAndDelete(req.params.id);
    res.redirect("/fornecedoradm/lst");
  } catch (err) {
    console.error("Erro ao editar fornecedor:", err);
    res.redirect("/fornecedoradm/lst");
  }
});

// Rota GET para form de edição
app.get("/fornecedoradm/edit/:id", async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findById(req.params.id).lean();
    if (!fornecedor) {
      throw new Error("Fornecedor não encontrado");
    }
    res.render("fornecedoradm/edit", { formData: fornecedor, error: null });
  } catch (err) {
    console.error("Erro ao carregar fornecedor:", err);
    res.redirect("/fornecedoradm/lst");
  }
});

// Rota POST para salvar edição
app.post("/fornecedoradm/edit/:id", async (req, res) => {
  try {
    await Fornecedor.findByIdAndUpdate(req.params.id, {
      nome: req.body.nome,
      cnpj: req.body.cnpj.replace(/\D/g, ""),
      telefone: req.body.telefone.replace(/\D/g, ""),
      email: req.body.email,
      endereco: req.body.endereco,
      imagem: req.body.imagem || undefined,
    });

    res.redirect("/fornecedoradm/lst");
  } catch (err) {
    console.error("Erro ao atualizar fornecedor:", err);
    res.render("fornecedoradm/edit", {
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
