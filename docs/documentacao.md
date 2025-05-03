# Documentação do Projeto Memoreasy

## 📋 Visão Geral

Memoreasy é uma aplicação web moderna focada em auxiliar estudantes com ferramentas de estudo inteligentes. A plataforma oferece diversos recursos para facilitar o aprendizado, incluindo:

- Análise e correção gramatical
- Paráfrase de textos
- Análise profunda de textos
- Geração de conteúdo inteligente
- Criação e realização de quizzes personalizados
- Flashcards para memorização
- Mapas mentais para organização de ideias

## 🛠️ Tecnologias Utilizadas

O projeto utiliza um conjunto moderno de tecnologias:

- **Frontend**:
  - React 18.3
  - TypeScript
  - Vite (como build tool)
  - React Router v6 (para navegação)
  - Framer Motion (para animações)
  - Tailwind CSS (para estilização)
  - Lucide React (para ícones)
  - Zod (para validação de dados)

- **Backend**:
  - Supabase (Backend-as-a-Service)
  - Autenticação integrada com Supabase Auth
  - Banco de dados PostgreSQL (gerenciado pelo Supabase)
  - Edge Functions do Supabase (para lógica serverless)

## 🏗️ Estrutura do Projeto

```
memoreasy/
├── src/                         # Código-fonte principal
│   ├── components/              # Componentes reutilizáveis
│   ├── contexto/                # Contextos React (AutenticacaoContexto, etc)
│   ├── hooks/                   # Hooks personalizados
│   ├── lib/                     # Utilitários e configurações
│   ├── paginas/                 # Páginas do aplicativo
│   ├── rotas/                   # Configuração de rotas
│   └── tipos/                   # Definições de tipos TypeScript
├── public/                      # Arquivos estáticos
├── supabase/                    # Configurações do Supabase
│   └── functions/               # Edge Functions do Supabase
├── @docs/                       # Documentação do projeto
```

## 🔐 Autenticação

O sistema utiliza a autenticação do Supabase, implementada através do `AutenticacaoContexto.tsx`. Ele fornece:

- Login com email/senha
- Cadastro de novos usuários
- Persistência de sessão
- Rotas protegidas (somente para usuários autenticados)

O contexto de autenticação gerencia o estado do usuário atual e disponibiliza funções para:
- `entrar(email, senha)`
- `cadastrar(email, senha, nome)`
- `sair()`

> ✅ **ID do projeto Supabase:**  
> Este repositório está vinculado ao projeto Supabase com o identificador:  
> `uktkugoorkqgyigkdbpr`  
>  
> Use esse ID para integrações via MCP, automações ou scripts.  

## 📱 Páginas e Funcionalidades

### Páginas Públicas
- **LandingPage**: Página inicial para usuários não autenticados
- **Login**: Formulário de login
- **Cadastro**: Formulário de cadastro de novos usuários

### Páginas Protegidas (requerem autenticação)
- **Dashboard**: Visão geral das ferramentas disponíveis
- **Gramática**: Análise e correção gramatical
- **Paráfrase**: Reescrita de textos mantendo o significado
- **Analisador**: Análise profunda de textos
- **Gerador**: Geração de conteúdo inteligente
- **Quiz**: Criação e resolução de questionários de estudo
- **Flashcards**: Cartões de memória para técnicas de estudo
- **Mapas**: Criação de mapas mentais

### Quiz (Funcionalidade Principal)
O módulo de Quiz permite:
- Criar questionários baseados em material de estudo
- Personalizar o número de questões
- Escolher o tipo de questão (múltipla escolha, etc.)
- Selecionar nível de dificuldade
- Visualizar relatório de desempenho

A geração de quizzes utiliza uma Edge Function do Supabase para processar o material de estudo e criar perguntas relevantes.

## 🎨 UI/UX

A interface de usuário possui:
- Suporte a tema claro/escuro
- Design responsivo para dispositivos móveis e desktop
- Animações suaves com Framer Motion
- Layout consistente com barra lateral de navegação
- Componentes interativos com feedback visual

## 🗄️ Modelo de Dados

As principais entidades do sistema são:

### Usuário
```typescript
interface Usuario {
  id: string;
  email: string;
  nome: string;
  criadoEm: Date;
}
```

### Quiz
```typescript
interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
  user_responses: UserResponse[];
}
```

### Questão
```typescript
interface Question {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  created_at: string;
}
```

### Resposta do Usuário
```typescript
interface UserResponse {
  id: string;
  user_id: string;
  quiz_id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  created_at: string;
}
```

## 🚀 Configuração e Execução

### Pré-requisitos
- Node.js (versão recomendada: v16+)
- npm ou yarn

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### Instalação
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Visualizar build de produção
npm run preview
```

## 🧩 Extensibilidade

Para adicionar novas funcionalidades:

1. Crie um novo componente na pasta `components/`
2. Adicione uma nova página em `paginas/`
3. Configure a rota em `rotas/index.tsx`
4. Se necessário, crie novas funções serverless em `supabase/functions/`

## 📈 Arquitetura e Escalabilidade

O projeto segue uma arquitetura cliente-servidor, onde:

- **Cliente**: Aplicação React responsável pela interface e experiência do usuário
- **Servidor**: Supabase fornece autenticação, banco de dados e funções serverless

Esta arquitetura permite:
- Escalar componentes independentemente
- Manter a lógica de negócio isolada em funções serverless
- Atualizar partes do sistema sem afetar o todo

## 🛡️ Segurança

- Autenticação gerenciada pelo Supabase Auth
- Todas as requisições à API usam tokens JWT
- Lógica de processamento sensível executada em Edge Functions
- Nenhuma credencial exposta no código frontend

## 👥 Contribuição

Para contribuir com o projeto:

1. Clone o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Implemente suas mudanças seguindo os padrões do projeto
4. Envie um Pull Request com descrição detalhada das alterações

## 📜 Licença

Este projeto é de uso interno e não possui licença pública definida.

---

Documentação criada em: 03/05/2025 