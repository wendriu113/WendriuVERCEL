# 1. Inicializar o repositório local
git init

# 2. Verificar se existe remote configurado
git remote -v

# 3. (Opcional) Remover remote errado
git remote remove origin

# 4. Adicionar o repositório remoto correto
git remote add origin https://github.com/wendriu113/WendriuVERCEL.git

# 5. Adicionar arquivos ao stage
git add .

# 6. Criar o commit inicial
git commit -m "primeiro commit"

# 7. Puxar alterações do remoto (necessário se o repo não estiver vazio)
git pull origin main --allow-unrelated-histories

# 8. Enviar tudo para o repositório remoto
git push -u origin main
