# GBarber - Sistema de Gestão de Barbearia SaaS

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Firebase (gratuita)

---

### Passo 1: Criar projeto no Firebase

1. Acesse [firebase.google.com](https://firebase.google.com)
2. Crie um novo projeto
3. Ative **Authentication**:
   - Vá em Authentication → Sign-in method
   - Ative "Email/Password"
4. Ative **Firestore Database**:
   - Vá em Firestore Database → Create Database
   - Escolha localização (us-central1 recomendado)
   - Comece em modo de produção (ou teste para desenvolvimento)
5. Obtenha as credenciais:
   - Vá em Project Settings → General
   - Role até "Your apps" → Selecione Web (</>)
   - Copie o objeto `firebaseConfig`

---

### Passo 2: Configurar variáveis de ambiente

No arquivo `.env.local` na raiz do projeto, configure:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

Substitua pelos valores do seu projeto Firebase.

---

### Passo 3: Instalar dependências

```bash
cd gbarber-app
npm install
```

---

### Passo 4: Executar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

### Passo 5: Regras de segurança do Firestore

No console do Firebase, em Firestore Database → Rules, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuário só acessa seus próprios dados
    match /barbearias/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📦 Build para Produção

```bash
npm run build
```

---

## 🌐 Deploy no Vercel

1. Crie uma conta no [Vercel](https://vercel.com)
2. Conecte seu repositório GitHub
3. Adicione as variáveis de ambiente no Vercel
4. Deploy automático a cada push

---

## 🎯 Estrutura das Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Redireciona para /login |
| `/login` | Login de usuário |
| `/login/cadastro` | Cadastro de nova barbearia |
| `/dashboard` | Dashboard principal |
| `/dashboard/atendimentos` | Gestão de atendimentos |
| `/dashboard/barbeiros` | Cadastro de barbeiros |
| `/dashboard/servicos` | Cadastro de serviços |
| `/dashboard/produtos` | Controle de estoque |
| `/dashboard/caixa` | Caixa do dia |
| `/dashboard/comissoes` | Relatório de comissões |
| `/dashboard/relatorios` | Relatórios gerais |
| `/dashboard/configuracoes` | Configurações |

---

## 💰 Preparado para Monetização

O sistema já inclui estrutura para planos:
- **Free**: Funcionalidades básicas
- **Pro**: Mais recursos
- **Premium**: Acesso completo

Basta implementar a lógica de verificação de plano nos componentes.

---

## 📝 Funcionalidades Incluídas

- ✅ Autenticação (Firebase Auth)
- ✅ Multi-tenant (dados isolados por usuário)
- ✅ Dashboard com KPIs
- ✅ Gestão de atendimentos
- ✅ Gestão de barbeiros
- ✅ Gestão de serviços
- ✅ Controle de produtos/estoque
- ✅ Caixa diário
- ✅ Comissões por barbeiro
- ✅ Relatórios
- ✅ Interface responsiva
- ✅ Toasts e loading states

---

## 📂 Estrutura do Projeto

```
gbarber-app/
├── src/
│   ├── app/              # Páginas Next.js
│   │   ├── dashboard/    # Páginas internas
│   │   ├── login/        # Login e cadastro
│   │   └── page.tsx      # Redirect
│   ├── components/       # Componentes React
│   │   ├── layout/      # Sidebar, Topbar
│   │   └── ui/          # Componentes Shadcn
│   ├── hooks/           # Custom hooks
│   │   ├── use-auth.tsx # Auth context
│   │   └── use-toast.ts # Toast notifications
│   ├── lib/             # Utilitários
│   │   ├── firebase.ts  # Config Firebase
│   │   └── utils.ts     # Funções úteis
│   └── types/           # TypeScript interfaces
├── .env.local           # Variáveis de ambiente
├── package.json
└── SPEC.md              # Especificação do projeto
```

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:
1. Verifique as variáveis de ambiente
2. Confirme as regras do Firestore
3. Verifique o console do navegador para erros