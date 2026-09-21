# Gerador e Gerenciador de Cartões Digitais PWA — Integração Supabase

Sistema profissional completo para criação, gerenciamento e publicação de Cartões Digitais interativos (PWA), com suporte a QR Code personalizável, atendente virtual com inteligência artificial, formulário de primeiro contato e persistência segura em nuvem com **Supabase (PostgreSQL, Auth e Storage)**.

> 📋 **Documento de Auditoria e Arquitetura Completa:** Consulte o arquivo [`AUDITORIA_E_ARQUITETURA_SISTEMA.md`](./AUDITORIA_E_ARQUITETURA_SISTEMA.md) para a documentação técnica integral do sistema, dicionário de dados (108 colunas), endpoints de API, fluxos de segurança LGPD/OWASP e roteiro de testes para auditoria.

---

## 1. Como o Supabase foi integrado ao projeto

A arquitetura do projeto foi estruturada para garantir segurança, desempenho e isolamento de dados:

1. **Frontend (React + Vite + Wouter)**:
   - **Autenticação Global (`src/contexts/AuthContext.tsx`)**: Gerencia o estado da sessão de usuário (`useAuth`), escuta mudanças de autenticação em tempo real (`onAuthStateChange`) e sincroniza com o Supabase Auth.
   - **Cliente Supabase Seguro (`src/lib/supabase.ts`)**: Inicializa dinamicamente o SDK `@supabase/supabase-js` consumindo apenas as credenciais públicas (`SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`).
   - **Mapeamento Bidirecional de Dados**: Converte automaticamente entre a convenção de nomenclatura do banco em `snake_case` (ex: `user_id`, `company_logo_url`) e o modelo TypeScript da aplicação em `camelCase` (ex: `companyLogoUrl`).
   - **Storage Integrado**: Uploads de foto de perfil, logotipos, imagem de fundo e ícones mobile PWA são enviados diretamente para o bucket `card-assets` do Supabase Storage, retornando URLs persistentes via CDN com fallback transparente para base64.

2. **Backend e Servidor (`server.ts`)**:
   - Endpoint `/api/config`: Fornece com segurança apenas a URL e a Publishable Key para o frontend, mantendo a `SUPABASE_SECRET_KEY` restrita ao ambiente seguro do servidor.
   - Suporte híbrido: Garante funcionamento contínuo e compatibilidade com modo de desenvolvimento local ou prévias offline.

3. **Automação Keep-Alive (`.github/workflows/supabase-keepalive.yml`)**:
   - Rotina automatizada via GitHub Actions executada duas vezes por semana para consultar o banco de dados e evitar a pausa por inatividade do plano gratuito do Supabase.

---

## 2. Variáveis de Ambiente e GitHub Secrets

O projeto utiliza três variáveis principais:

| Variável / Secret | Finalidade | Onde é utilizada |
| :--- | :--- | :--- |
| `SUPABASE_URL` | URL do projeto Supabase (ex: `https://xyz.supabase.co`) | Frontend (via `/api/config`), Backend e GitHub Actions |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública anônima (`anon` key / `publishable`) | Frontend e Backend |
| `SUPABASE_SECRET_KEY` | Chave de serviço administrativa (`service_role` key) | **Somente** no ambiente seguro do GitHub Actions / automação de servidor |

> ⚠️ **Importante**: A `SUPABASE_SECRET_KEY` **NUNCA** é exposta ao navegador nem inserida nos pacotes estáticos do frontend.

---

## 3. Configuração do Ambiente Local (.env)

1. Crie um arquivo `.env` na raiz do projeto (ou copie a partir do `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Preencha os valores obtidos no painel do Supabase (**Project Settings > API**):
   ```env
   # Configuração do Supabase
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sua-anon-public-key-aqui
   SUPABASE_SECRET_KEY=sua-service-role-secret-key-aqui
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 4. Configuração dos GitHub Secrets

Para habilitar a automação de Keep-Alive e pipelines de CI/CD:

1. Acesse o repositório no GitHub.
2. Navegue até **Settings** > **Secrets and variables** > **Actions**.
3. Clique em **New repository secret** e cadastre:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`

---

## 5. Como Executar a Migration SQL no Supabase

Todas as tabelas, tipos de dados, gatilhos de atualização, políticas de Row Level Security (RLS) e configurações do Storage estão reunidos em:
📁 `supabase/migrations/20260916120000_create_digital_cards_schema.sql`

### Opção A: Pelo Painel Web do Supabase (Recomendado)
1. Acesse seu painel em [supabase.com](https://supabase.com) e entre no seu projeto.
2. No menu lateral esquerdo, clique no ícone **SQL Editor** (ícone de terminal `>_`).
3. Clique em **New query**.
4. Copie todo o conteúdo do arquivo `supabase/migrations/20260916120000_create_digital_cards_schema.sql` e cole no editor.
5. Clique em **Run** (ou pressione `Ctrl+Enter`).
6. Verifique a mensagem de sucesso: `"Success. No rows returned"`.

### Opção B: Via Supabase CLI
```bash
supabase db push
# ou
supabase migration up
```

---

## 6. Configuração do Storage (Bucket `card-assets`)

O script de migração já cria automaticamente o bucket `card-assets` e configura as políticas de segurança. Se desejar verificar ou criar manualmente:

1. No painel do Supabase, acesse **Storage**.
2. Verifique se o bucket `card-assets` existe. Caso contrário, clique em **New Bucket**:
   - Nome: `card-assets`
   - Público: Ativado (`Public bucket: true`) para que imagens e avatares possam ser visualizados publicamente nos cartões por clientes.
3. As políticas RLS garantem que:
   - **Upload / Update / Delete**: Apenas o usuário autenticado que é dono da pasta `${auth.uid()}/...` pode modificar ou deletar arquivos.
   - **Select (Leitura)**: Permitido publicamente para visualização no cartão digital público.

---

## 7. Regras de Segurança Adotadas (RLS)

- **Row Level Security (RLS)** habilitado em todas as tabelas:
  - `digital_cards`: Cada usuário só pode visualizar, alterar ou excluir os cartões criados pelo seu próprio `user_id` (`auth.uid() = user_id`).
  - **Exceção de Leitura Pública**: Cartões marcados como `status = 'ativo'` possuem permissão de leitura anônima para que o público final possa abrir o link `https://seusite.com/cartao/:slug` e interagir com o cartão sem precisar de conta.
  - `digital_card_inquiries`: O público pode submeter mensagens no formulário (`INSERT`), mas apenas o dono do cartão pode ler as mensagens recebidas (`SELECT`).
  - `digital_card_events`: Registro de métricas de visualização e cliques permitido anonimamente (`INSERT`), com leitura restrita ao proprietário.

---

## 8. Como Testar Login, Cadastro, Logout e Persistência

1. **Acessar a Aplicação**:
   - Abra a página inicial `/` e clique em **Acessar Painel** ou **Entrar**.
   - Ou acesse diretamente `/login` ou `/app`.

2. **Criar uma Conta (Cadastro)**:
   - No modal de autenticação, clique na aba **Criar Conta**.
   - Informe Nome, E-mail e Senha (mínimo de 6 caracteres).
   - Ao confirmar, o usuário é cadastrado no Supabase Auth e o perfil é sincronizado automaticamente na tabela `profiles`.

3. **Criar e Persistir um Cartão**:
   - No painel, clique em **Novo Cartão**.
   - Preencha o nome, cargo, WhatsApp, e personalize cores e QR Code.
   - Faça upload de uma foto de perfil (será enviada ao Supabase Storage).
   - Clique em **Salvar Cartão**.
   - Atualize a página (`F5`) ou acesse de outro navegador: seus cartões permanecem salvos e carregados diretamente da sua conta no Supabase.

4. **Testar Página Pública**:
   - Clique no botão **Página Pública** (ou acesse `/cartao/:slug`).
   - O cartão é renderizado perfeitamente com todas as informações salvas no banco de dados.

5. **Testar Logout**:
   - No painel superior, clique no botão **Sair**.
   - A sessão será encerrada e você será redirecionado para a tela de autenticação.

---

## 9. Testar o GitHub Actions Keep-Alive

1. No GitHub, acesse a aba **Actions**.
2. Selecione o workflow **Supabase Keep-Alive Health Check**.
3. Clique em **Run workflow** para disparar manualmente.
4. O job executará um ping na tabela `system_health` validando que a instância está operando normalmente.
