# Interfone SaaS - MVP

Sistema de interfonia IP multi-tenant para condomínios.

## ✅ O que funciona neste MVP

- ✅ Docker Compose completo (MySQL + API + FreePBX + Nginx)
- ✅ API REST (Node.js/Express)
- ✅ CRUD de Condomínios
- ✅ Geração automática de Ramais
- ✅ Schema de banco otimizado
- ✅ Multi-tenant por subdomínio

## 🚀 Instalação Rápida

### 1. Clone/Entre no diretório
```bash
cd /home/node/.openclaw/workspace/interfone-saas
```

### 2. Suba os containers
```bash
docker-compose up -d
```

### 3. Aguarde iniciar (30s)
```bash
docker-compose logs -f api
```

### 4. Teste a API
```bash
curl http://localhost:3000/api/health
```

## 📋 Endpoints da API

### Auth
- `POST /api/auth/login` - Login admin
- `POST /api/auth/login-condominio` - Login morador

### Condomínios
- `GET /api/condominios` - Lista todos
- `POST /api/condominios` - Cria novo
- `GET /api/condominios/:id` - Detalhes
- `PUT /api/condominios/:id` - Atualiza
- `DELETE /api/condominios/:id` - Remove

### Ramais
- `GET /api/ramais/condominio/:id` - Lista de ramais
- `POST /api/ramais` - Cria ramal manual
- `POST /api/ramais/gerar` - Gera automático
- `GET /api/ramais/:id/config-sip` - Config Zoiper

## 🔧 Configuração

### Criar primeiro condomínio
```bash
curl -X POST http://localhost:3000/api/condominios \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "meucondominio",
    "nome": "Condomínio Exemplo",
    "cidade": "São Paulo",
    "estado": "SP",
    "admin_nome": "João",
    "admin_email": "admin@condo.com"
  }'
```

### Gerar ramais automáticos
```bash
curl -X POST http://localhost:3000/api/ramais/gerar \
  -H "Content-Type: application/json" \
  -d '{
    "condominio_id": 1,
    "andares": 10,
    "aptos_por_andar": 4,
    "torre_codigo": "T1"
  }'
```

## 📱 Configurar Zoiper

1. Baixe Zoiper no celular
2. Escanee QR ou configure manual:
   - Usuário: 1001 (número do ramal)
   - Senha: (consulte endpoint /config-sip)
   - Domínio: meucondominio.interfone.local
   - Porta: 5060

## 🗂️ Estrutura

```
interfone-saas/
├── docker-compose.yml
├── database/
│   ├── init.sql
│   └── schema.sql
├── api/
│   ├── server.js
│   ├── database.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── condominios.js
│   │   └── ramais.js
│   └── package.json
├── nginx/
│   └── nginx.conf
└── README.md (este arquivo)
```

## ⚠️ Limitações do MVP

- Sem interface web (usar Postman/HTTP)
- Sem WebRTC (usar Zoiper)
- Sem push notifications
- Um FreePBX para todos (não separado por tenant ainda)

## 🔐 Credenciais Padrão

- Admin: admin@interfone.com / password

## 🐛 Troubleshooting

### API não conecta no MySQL
```bash
docker-compose restart api
```

### Resetar tudo
```bash
docker-compose down -v
docker-compose up -d
```

## 📞 Suporte

Abra issue no repositório ou contate dev@to-ligado.com
