# Deploy no Easypanel - Guia Completo

## 🚀 Passo a Passo

### 1. Preparar Repositório GitHub

```bash
# No diretório do projeto
cd /home/node/.openclaw/workspace/interfone-saas

# Inicializar git (se não estiver)
git init

# Adicionar todos os arquivos
git add .

# Commit
git commit -m "MVP Interfone SaaS v1.0"

# Adicionar remote (substitua pela sua URL do GitHub)
git remote add origin https://github.com/SEU_USUARIO/interfone-saas.git

# Push
git push -u origin main
```

### 2. Configurar GitHub Secrets

Vá em: **Settings → Secrets and variables → Actions → New repository secret**

Adicione estes secrets:

| Secret Name | Descrição | Exemplo |
|-------------|-----------|---------|
| `EASYPANEL_TOKEN` | Token de acesso ao Easypanel | `ep_abc123xyz` |
| `EASYPANEL_REGISTRY` | URL do registry | `registry.seuservidor.com` |
| `EASYPANEL_WEBHOOK_URL` | URL do webhook de deploy | `https://easypanel.seuservidor.com/api/github` |
| `EASYPANEL_API_KEY` | API Key do Easypanel | `sk_live_...` |

### 3. Configurar no Easypanel

#### Método 1: Via Interface Web

1. Acesse seu Easypanel
2. Clique em **"Add Service"**
3. Escolha **"Git Repository"**
4. Cole a URL: `https://github.com/SEU_USUARIO/interfone-saas.git`
5. Branch: `main`
6. **Build Path:** `./api`
7. **Dockerfile:** `Dockerfile`
8. Port: `3000`
9. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=database
   DB_NAME=interfone_saas
   DB_USER=saas_user
   DB_PASS=senha_segura_123
   JWT_SECRET=chave_jwt_super_secreta
   ```

#### Método 2: Via Docker Compose (Recomendado para MVP)

1. Crie um arquivo `docker-compose.easypanel.yml` no repositório
2. Ou use o `easypanel.json` já criado
3. No Easypanel: **Add Service → Docker Compose**
4. Faça upload do `docker-compose.yml`

### 4. Configurar MySQL no Easypanel

Como o Easypanel não tem MySQL nativo fácil, sugiro:

#### Opção A: MySQL via Docker separado
```yaml
services:
  database:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: interfone_saas
      MYSQL_USER: saas_user
      MYSQL_PASSWORD: userpass
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

#### Opção B: Easypanel Database Service
Se seu Easypanel tem addon de MySQL:
1. Services → Add → MySQL
2. Crie banco `interfone_saas`
3. Copie as credenciais
4. Atualize o `DB_HOST` no .env

### 5. Deploy Automático

Após configurar os secrets do GitHub, todo push na `main` vai:

1. ✅ Buildar a imagem Docker
2. ✅ Rodar testes (se houver)
3. ✅ Enviar para registry (opcional)
4. ✅ Notificar Easypanel via webhook
5. ✅ Easypanel faz deploy automaticamente

### 6. verificar Deploy

```bash
# Acesse a URL do serviço no Easypanel
# Exemplo: https://interfone-api.seudominio.com

# Teste a API
curl https://interfone-api.seudominio.com/api/health
```

## 🔧 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se `DB_HOST` está correto
- No Easypanel, use o nome do serviço MySQL como host

### Erro: "JWT não funciona"
- Certifique-se que `JWT_SECRET` está configurado nas env vars

### Erro: "Porta já em uso"
- Mude a porta no docker-compose ou easypanel.json

### Deploy não atualiza
- Verifique se o webhook URL está correto
- Manualmente: "Redeploy" no painel do Easypanel

## 📋 Checklist Final

- [ ] Repositório no GitHub
- [ ] GitHub Secrets configurados
- [ ] Serviço criado no Easypanel
- [ ] MySQL rodando e acessível
- [ ] Environment variables configuradas
- [ ] Porta 3000 exposta
- [ ] Teste de health check passando
- [ ] Configuração de SIP/FreePBX (fase 2)

## 🎯 Próximos Passos (Pós Deploy)

1. Configurar FreePBX (container separado)
2. Configurar Nginx reverse proxy
3. Testar endpoints da API
4. Conectar Zoiper
5. Painel web (fase 2)

---

**Precisa de ajuda?** Me avise qual erro aparece no deploy!
