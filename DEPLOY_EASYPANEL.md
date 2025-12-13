# 🚀 Deploy Rápido no EasyPanel com Docker Compose

Este guia mostra como fazer deploy do Lumos IA no EasyPanel usando docker-compose em **5 passos simples**.

---

## 📋 Pré-requisitos

1. ✅ EasyPanel instalado na sua VPS
2. ✅ Repositório Git: `https://github.com/juliolopes-dev/lumos_ai.git`
3. ✅ Chave da API OpenAI

---

## 🚀 Passo a Passo

### **1. Criar Novo Projeto no EasyPanel**

1. Acesse seu EasyPanel
2. Clique em **"+ New Project"**
3. Nome do projeto: `lumos-ia`
4. Clique em **"Create"**

---

### **2. Criar App com Docker Compose**

1. Dentro do projeto, clique em **"+ Service"**
2. Escolha **"App"**
3. Configure:
   - **Service Name**: `lumos-stack`
   - **Source**: **GitHub**
   - **Repository**: `https://github.com/juliolopes-dev/lumos_ai.git`
   - **Branch**: `main`
   - **Build Method**: **Docker Compose**

---

### **3. Configurar Variáveis de Ambiente**

Na aba **"Environment"**, adicione as seguintes variáveis:

```env
POSTGRES_PASSWORD=SuaSenhaSegura123
OPENAI_API_KEY=sk-sua-chave-openai-aqui
OPENAI_MODEL=gpt-4.1-mini
VITE_API_URL=http://backend:3001/api
```

⚠️ **IMPORTANTE**: 
- Substitua `SuaSenhaSegura123` por uma senha forte
- Substitua `sk-sua-chave-openai-aqui` pela sua chave REAL da OpenAI

---

### **4. Configurar Domínios**

Na aba **"Domains"**:

O EasyPanel vai criar automaticamente os domínios. Você precisa mapear:

| Serviço | Porta Interna | Domínio Gerado (exemplo) |
|---------|---------------|--------------------------|
| `frontend` | 80 | `lumos-stack.seu-servidor.easypanel.host` |
| `backend` | 3001 | `api-lumos.seu-servidor.easypanel.host` |

**Configure os domains:**
1. Para o **frontend**: porta `80` → deixe o domínio padrão
2. Para o **backend**: porta `3001` → adicione um domínio (opcional)

📝 **Anote o domínio do backend** se você quiser acessar a API externamente!

---

### **5. Deploy!**

1. Revise todas as configurações
2. Clique em **"Create"** (ou "Deploy")
3. Aguarde o build (2-5 minutos)

O EasyPanel vai:
- ✅ Criar o container PostgreSQL
- ✅ Criar o container Redis
- ✅ Fazer build e iniciar o Backend
- ✅ Fazer build e iniciar o Frontend

---

## ✅ Verificar Deploy

### 1. **Verificar Logs**

No EasyPanel, vá em cada serviço e verifique os logs:

- **postgres**: Deve mostrar "database system is ready to accept connections"
- **redis**: Deve mostrar "Ready to accept connections"
- **backend**: Deve mostrar "🚀 Servidor rodando na porta 3001"
- **frontend**: Nginx já inicia servindo na porta 80

### 2. **Testar Backend**

Abra no navegador:
```
https://SEU-DOMINIO-BACKEND.easypanel.host/health
```

Deve retornar:
```json
{"status":"ok","message":"Lumos IA Backend rodando!"}
```

### 3. **Acessar a Aplicação**

Abra no navegador:
```
https://SEU-DOMINIO-FRONTEND.easypanel.host
```

**Credenciais de Login:**
- Email: `juliofranlopes18@gmail.com`
- Senha: `Juliofran1996@`

---

## 🔧 Ajustes Pós-Deploy

### **Atualizar URL da API no Frontend**

Se o backend tiver domínio externo diferente, você precisa atualizar:

1. No EasyPanel, vá no serviço `lumos-stack`
2. Edite a variável de ambiente:
   ```
   VITE_API_URL=https://SEU-DOMINIO-BACKEND.easypanel.host/api
   ```
3. Clique em **"Redeploy"** para reconstruir o frontend

---

## 📊 Estrutura dos Serviços

O docker-compose.yml cria 4 serviços:

```
┌─────────────────────────────────────┐
│         FRONTEND (Porta 80)         │
│    React + Vite + Nginx             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│        BACKEND (Porta 3001)         │
│    Node.js + Express + OpenAI       │
└──────┬────────────────┬─────────────┘
       │                │
       ↓                ↓
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │
│  (Porta 5432)│  │ (Porta 6379) │
└──────────────┘  └──────────────┘
```

---

## 🔄 Atualizar a Aplicação

Para atualizar após fazer mudanças no código:

1. Faça commit e push para o GitHub
2. No EasyPanel, vá no serviço `lumos-stack`
3. Clique em **"Redeploy"**
4. Aguarde o rebuild

---

## 🐛 Troubleshooting

### Frontend não conecta ao Backend
**Solução**: Verifique se `VITE_API_URL` está correto e reconstrua o frontend

### Erro no PostgreSQL
**Solução**: Verifique se `POSTGRES_PASSWORD` está definido nas variáveis de ambiente

### Erro "OpenAI API key not found"
**Solução**: Verifique se `OPENAI_API_KEY` está configurado corretamente

### Serviços não iniciam na ordem
**Solução**: O docker-compose já tem `depends_on` configurado, aguarde alguns segundos

---

## 📝 Variáveis de Ambiente - Resumo

| Variável | Obrigatória? | Descrição |
|----------|--------------|-----------|
| `POSTGRES_PASSWORD` | ✅ Sim | Senha do banco PostgreSQL |
| `OPENAI_API_KEY` | ✅ Sim | Chave da API OpenAI |
| `OPENAI_MODEL` | ⚠️ Opcional | Modelo GPT (padrão: gpt-4.1-mini) |
| `VITE_API_URL` | ⚠️ Condicional | URL da API (use domínio interno ou externo) |

---

## 🎉 Pronto!

Sua aplicação Lumos IA está rodando no EasyPanel!

**URLs Finais:**
- **App**: `https://seu-dominio-frontend.easypanel.host`
- **API**: `https://seu-dominio-backend.easypanel.host/api`

---

**Precisa de ajuda?** Verifique os logs dos serviços no EasyPanel.
