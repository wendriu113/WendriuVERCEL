import app from "./api/index.js";
import conexao from "./config/conexao.js";

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
