import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  HelpCircle,
  Sparkles,
  Smartphone,
  QrCode,
  Bot,
  Palette,
  Layers,
  FileText,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  ArrowLeft,
  X,
} from 'lucide-react';

export interface DocArticle {
  id: string;
  filename: string;
  title: string;
  category: string;
  description: string;
  icon: any;
  tags: string[];
  content: string;
}

export const DOC_ARTICLES: DocArticle[] = [
  {
    id: '01-visao-geral',
    filename: '01-visao-geral.md',
    title: '01. Visão Geral do Software',
    category: 'Introdução',
    description: 'Conceito do Cartão Digital Inteligente, arquitetura do sistema e principais vantagens em relação a cartões impressos.',
    icon: BookOpen,
    tags: ['introdução', 'sobre', 'visao geral', 'funcionalidades', 'beneficios', 'pwa', 'vcard', 'arquitetura', 'software'],
    content: `# 01. Visão Geral do Software

## O que é o Cartão Digital Inteligente Átomos Infinity?
O **Cartão Digital Inteligente Átomos Infinity** é uma solução completa para profissionais, consultores, empresários e equipes corporativas que desejam transformar sua presença comercial e networking em uma ferramenta moderna, rápida e interativa.

Diferente de cartões de visita impressos estáticos ou simples páginas de links, o Cartão Inteligente reúne:

- 📱 **Experiência PWA (Progressive Web App)**: Seu cliente pode instalar o seu cartão como um ícone na tela inicial do celular sem precisar de lojas de aplicativos (App Store / Google Play).
- 📇 **Download de Contato Direto (vCard .vcf)**: Salva instantaneamente todos os seus telefones, e-mails, endereços e redes sociais na agenda do smartphone do visitante com 1 clique.
- 🤖 **Atendente Virtual com Inteligência Artificial**: Um atendente digital capaz de tirar dúvidas dos seus clientes, explicar seus serviços e conduzir para o WhatsApp ou formulário.
- 🎨 **Estúdio de Design em Tempo Real**: Pré-visualização instantânea conforme você digita dados, troca cores, logos e temas.
- 🔳 **QR Code Dinâmico Personalizado**: QR Code com logomarca, cores customizadas, gradientes, molduras e exportação em alta resolução para materiais impressos.
- 📊 **Métricas e Relatório de Engajamento**: Contador em tempo real de visualizações, cliques no WhatsApp, cópias de chave PIX, downloads de vCard e integrações com Google Analytics / Meta Pixel.

---

## Como o Sistema Está Estruturado?
1. **Painel de Gestão e Criação (/app ou /painel)**: Ambiente autenticado onde você cria novos cartões, edita layouts, analisa métricas e responde a mensagens recebidas.
2. **Página Pública do Cartão (/cartao/seu-slug)**: Página de altíssima velocidade, 100% responsiva (otimizada para smartphones e desktops) que seus clientes acessam ao ler o QR Code ou clicar no seu link.
3. **Página Institucional e Apresentação (/)**: Landing page demonstrando os recursos e planos disponíveis.
4. **Central de Ajuda e Documentação (/doc)**: Base de conhecimento integrada com busca por palavras-chave e guias práticos.`,
  },
  {
    id: '02-passo-a-passo',
    filename: '02-passo-a-passo-criacao.md',
    title: '02. Passo a Passo: Criando Seu Cartão do Zero',
    category: 'Criação & Edição',
    description: 'Guia prático para preencher dados do titular, slug exclusivo, fotos, canais de contato, chave PIX e redes sociais.',
    icon: Layers,
    tags: ['criar cartao', 'passo a passo', 'novo cartao', 'slug', 'foto', 'logo', 'contato', 'whatsapp', 'pix', 'telefone', 'email', 'redes sociais', 'bio'],
    content: `# 02. Passo a Passo: Criando Seu Cartão do Zero

A criação de um cartão na plataforma Átomos Infinity é rápida, visual e dividida em seções claras dentro do editor. Siga as instruções abaixo:

### Passo 1: Acessar o Painel e Iniciar um Novo Cartão
1. Faça login na sua conta no endereço **/login** ou **/app**.
2. No canto superior direito, clique no botão **"+ Novo Cartão"**.
3. O editor será aberto com os campos predefinidos para você personalizar.

### Passo 2: Dados Principais e Identificação
- **Nome Completo**: Seu nome profissional (ex.: *Eng. Jurandir Hora*).
- **Cargo / Especialidade**: Sua profissão ou foco de atuação (ex.: *Diretor de Engenharia & Consultoria*).
- **Nome da Empresa / Marca**: Nome do seu negócio (ex.: *Átomos Infinity*).
- **Identificador Único (Slug do Link)**: A parte final do seu link (ex.: \`consultor-jurandir\`). O endereço final será \`seusite.com/cartao/consultor-jurandir\`.
- **Resumo Profissional / Bio**: Breve descrição de 2 a 3 frases explicando sua especialidade.

### Passo 3: Foto de Perfil e Logotipo da Empresa
- **Foto de Perfil**: Insira o link da sua foto em formato quadrado.
- **Logotipo da Empresa**: Insira a imagem da logomarca da sua empresa.
- **Enquadramento**: Use os controles de Escala e Ponto de Foco (X/Y) para alinhar perfeitamente o rosto.

### Passo 4: Canais de Contato e Comunicação Direta
- **WhatsApp**: Número internacional completo com DDD (ex.: \`+55 (15) 99625-9353\`).
- **Telefone Convencional / Celular**: Para chamadas de voz diretas.
- **E-mail Comercial**: Para envio de e-mails instantâneos.
- **Endereço e Site Oficial**: Para localização e presença institucional.

### Passo 5: Chave PIX e Pagamento Rápido
- Ative **"Exibir Chave PIX"**, informe o tipo e a chave para habilitar o botão de cópia com 1 clique.

### Passo 6: Salvar e Publicar
- Clique no botão verde **"Salvar Alterações"**. O cartão estará online imediatamente!`,
  },
  {
    id: '03-design-e-personalizacao',
    filename: '03-design-e-personalizacao.md',
    title: '03. Design, Cores, Tipografia & Temas',
    category: 'Design & Visual',
    description: 'Como personalizar paletas de cores, temas escuros/claros, tipografia, cantos de botões e imagens de fundo.',
    icon: Palette,
    tags: ['design', 'cores', 'temas', 'paleta', 'tipografia', 'fontes', 'fundo', 'background', 'botoes', 'radius', 'personalizacao visual'],
    content: `# 03. Design, Cores, Tipografia & Temas

O Cartão Digital Inteligente possui um estúdio de personalização visual completo para adequar o cartão à identidade visual da sua marca corporativa.

### Temas e Paletas Predefinidas
- **Átomos Corporativo (Padrão)**: Azul marinho profundo (\`#12375B\`), azul elétrico (\`#1A7FBE\`) e fundo suave (\`#EAF1F7\`).
- **Dark Luxury / Black Gold**: Preto ônix com detalhes dourados.
- **Emerald Business**: Tons de verde esmeralda e floresta para sustentabilidade, agronegócio e saúde.
- **Modern Minimalist**: Escala de cinzas de alto contraste com preto puro.
- **Personalizado**: Liberdade total para selecionar qualquer cor hexadecimal.

### Personalização Detalhada de Elementos
- **Cabeçalho (Header)**: Cor e opacidade do bloco superior.
- **Fundo da Página**: Cor da área externa e margens.
- **Card de Conteúdo**: Cor do container central onde ficam os botões e dados.
- **Arredondamento dos Botões**: De cantos retos (0px) a botões totalmente em formato de pílula (24px).
- **Ícones**: Escolha de cor e tamanho dos ícones de contato.
- **Tipografia**: Opções entre Sans-Serif moderna, Serif tradicional e Mono técnica.`,
  },
  {
    id: '04-qr-code',
    filename: '04-qr-code-personalizado.md',
    title: '04. QR Code Dinâmico e Personalizado',
    category: 'QR Code',
    description: 'Customização de formatos dos pontos, gradientes de cores, logotipo no centro, molduras e exportação em PNG, SVG e PDF.',
    icon: QrCode,
    tags: ['qr code', 'qrcode', 'logo no qrcode', 'gradiente', 'impressao', 'svg', 'png', 'pdf', 'scan me', 'vetorial', 'grafica'],
    content: `# 04. QR Code Dinâmico e Personalizado

Todo cartão gerado possui um **QR Code Dinâmico e Vetorial integrado**. Ao ser escaneado, direciona imediatamente para o endereço do seu cartão.

### Recursos de Customização:
1. **Estilos dos Pontos e Cantos**: Opções em formato quadrado, arredondado ou suave.
2. **Cores e Gradientes**: Suporte a cor única, gradiente linear e fundo 100% transparente.
3. **Logotipo Central**: Inserção automática da sua logomarca no centro do código com correção de erro nível H.
4. **Molduras de Chamada (Frames)**: Molduras com textos como *SCAN ME* ou *LEIA MEU CARTÃO*.

### Como Exportar para Impressão:
- Clique em **"Baixar QR Code"** e selecione:
  - **PNG em Alta Resolução**: Para WhatsApp, e-mails e redes sociais.
  - **SVG (Vetor)**: Para gráficas (impressão em cartões PVC, crachás, adesivos e banners).
  - **PDF com Marca de Corte**: Para impressão direta de balcão.`,
  },
  {
    id: '05-atendente-ia',
    filename: '05-atendente-virtual-ia.md',
    title: '05. Atendente Virtual com Inteligência Artificial (IA)',
    category: 'Inteligência Artificial',
    description: 'Como funciona o assistente de IA no cartão, treinamento de prompt, efeito glow e transbordo para WhatsApp.',
    icon: Bot,
    tags: ['atendente virtual', 'ia', 'inteligencia artificial', 'chat', 'robo', 'bot', 'gemini', 'whatsapp', 'vendas', 'glow'],
    content: `# 05. Atendente Virtual com Inteligência Artificial (IA)

O **Atendente Virtual com IA** funciona como uma recepcionista ou consultor de vendas 24 horas por dia diretamente no seu cartão digital.

### Como Funciona:
1. O visitante abre o cartão e clica no botão com efeito luminoso de IA.
2. Uma janela interativa de chat é aberta.
3. O visitante tira dúvidas sobre serviços, preços, localização e horários.
4. A IA responde de forma precisa e qualifica o contato para fechar no WhatsApp.

### Configuração no Editor:
- **Ativar Atendente**: Habilita o módulo no cartão.
- **Mensagem de Boas-Vindas**: O texto de saudação inicial.
- **Instruções de Treinamento**: Forneça detalhes sobre a empresa, produtos, prazos e diferenciais.
- **Efeito Glow**: Pulso de luz animado no botão para aumentar a taxa de cliques.`,
  },
  {
    id: '06-pwa-vcard',
    filename: '06-pwa-e-vcard.md',
    title: '06. Progressive Web App (PWA) & vCard',
    category: 'Tecnologia & Mobile',
    description: 'Instalação do cartão como aplicativo no celular e download de contato com 1 clique para a agenda telefônica.',
    icon: Smartphone,
    tags: ['pwa', 'app', 'aplicativo', 'instalar', 'tela inicial', 'vcard', 'vcf', 'agenda', 'salvar contato', 'iphone', 'android'],
    content: `# 06. Progressive Web App (PWA) & vCard

A plataforma foi desenvolvida para facilitar ao máximo o compartilhamento e a retenção do seu contato no celular do cliente.

### Progressive Web App (PWA):
- Permite que o cliente adicione um ícone com sua logo na tela de início do smartphone.
- Funciona em tela cheia sem barras de navegador.
- Não precisa ser publicado ou baixado na App Store ou Google Play.

### Download de Contato vCard (.vcf):
- Botão **"Salvar Contato"** no cartão.
- Ao clicar, o arquivo \`.vcf\` é baixado e a agenda nativa do celular (Android ou iOS) abre com todos os dados (nome, telefone, e-mail, foto e empresa) prontos para salvar.`,
  },
  {
    id: '07-formulario-leads',
    filename: '07-formulario-e-leads.md',
    title: '07. Formulário de Contato, Mensagens & Leads',
    category: 'Captação de Clientes',
    description: 'Configuração do formulário de mensagem no rodapé do cartão e gestão de leads recebidos pelo painel.',
    icon: MessageSquare,
    tags: ['formulario', 'mensagens', 'leads', 'contato', 'propostas', 'receber mensagens', 'lgpd', 'gestao de leads'],
    content: `# 07. Formulário de Contato, Mensagens & Leads

Transforme seu cartão em uma página de captura de clientes com o formulário embutido.

### Recursos do Formulário:
- Campos configuráveis: Nome, E-mail, WhatsApp e Mensagem.
- Caixa de consentimento de contato em conformidade com a LGPD.

### Gestão no Painel:
- No painel **/app**, selecione o cartão e clique na aba **"Mensagens / Leads"**.
- Visualize os contatos recebidos com data, e-mail e telefone.
- Botão de **"Responder no WhatsApp"** em 1 clique para atendimento imediato.`,
  },
  {
    id: '08-metricas-analytics',
    filename: '08-metricas-e-analytics.md',
    title: '08. Métricas, Analytics & Pixels de Rastreamento',
    category: 'Métricas & Marketing',
    description: 'Relatórios de visualizações, cliques no WhatsApp, cópias de PIX e integração com Google Analytics 4 e Meta Pixel.',
    icon: BarChart3,
    tags: ['metricas', 'analytics', 'relatorios', 'cliques', 'visualizacoes', 'google analytics', 'ga4', 'meta pixel', 'facebook pixel', 'gtm', 'rastreamento'],
    content: `# 08. Métricas, Analytics & Pixels de Rastreamento

Acompanhe o desempenho do seu cartão e saiba exatamente quem está interagindo com você.

### Métricas Nativas no Painel:
- **Visualizações**: Total de acessos ao link ou QR Code.
- **Cliques no WhatsApp**: Quantas pessoas iniciaram conversa.
- **Cópias de PIX**: Quantidade de pagamentos iniciados.
- **Downloads de vCard**: Quantos contatos foram salvos na agenda.

### Pixels de Marketing:
- **Google Analytics 4 (ID G-XXXXXXX)**: Métricas detalhadas de tráfego.
- **Meta Pixel (ID numérico)**: Criação de públicos para anúncios de Remarketing no Instagram e Facebook.
- **Google Tag Manager (ID GTM-XXXXXXX)**: Gestão avançada de tags.`,
  },
  {
    id: '09-planos-gestao-master',
    filename: '09-planos-e-gestao-master.md',
    title: '09. Planos, Níveis de Acesso & Gestão Master',
    category: 'Administração & Planos',
    description: 'Diferença entre perfis Cliente, Administrador e Master, regras dos planos e painel de gestão de usuários.',
    icon: ShieldCheck,
    tags: ['planos', 'master', 'admin', 'usuarios', 'degustacao', 'profissional', 'corporativo', 'niveis de acesso', 'rbac', 'assinaturas'],
    content: `# 09. Planos, Níveis de Acesso & Gestão Master

A plataforma atende desde profissionais individuais até grandes corporações com equipes comerciais.

### Níveis de Acesso:
- **Cliente**: Gerencia apenas os seus próprios cartões e leads.
- **Admin**: Auxilia na criação e suporte a múltiplos cartões.
- **Master (Super Admin)**: Acesso total à aba de "Gestão de Usuários", alteração de papéis, liberação de planos e controle geral.

### Planos:
- **Degustação (Grátis)**: 1 Cartão para experimentação.
- **Profissional**: Até 3 cartões, QR Code avançado e métricas completas.
- **Corporativo**: Cartões ilimitados, IA avançada, exportação gráfica em SVG/PDF e suporte a equipes.`,
  },
  {
    id: '10-faq-duvidas',
    filename: '10-faq-e-duvidas.md',
    title: '10. Perguntas Frequentes & Solução de Dúvidas (FAQ)',
    category: 'Dúvidas & FAQ',
    description: 'Respostas para as dúvidas mais comuns sobre QR Code impresso, Instagram, agenda telefônica e suporte.',
    icon: HelpCircle,
    tags: ['faq', 'duvidas', 'perguntas frequentes', 'problemas', 'suporte', 'ajuda', 'contato suporte', 'instagram', 'qr impresso'],
    content: `# 10. Perguntas Frequentes & Solução de Dúvidas (FAQ)

### 1. Se eu alterar meus dados no painel, o QR Code impresso no meu cartão físico deixa de funcionar?
**Não!** O QR Code aponta para o link fixo do seu cartão. Qualquer atualização de telefone, foto ou dados no painel reflete automaticamente na hora.

### 2. O cliente precisa instalar aplicativo na loja?
**Não.** O cartão abre diretamente em qualquer navegador de smartphone.

### 3. Como colocar o link na bio do Instagram?
Copie o link do seu cartão (\`seusite.com/cartao/seu-nome\`) e cole no campo "Link" do seu perfil do Instagram.

### 4. Como solicitar suporte técnico?
Entre em contato pelo WhatsApp **+55 (15) 99625-9353** ou pelo e-mail **consultatomosinfinity@gmail.com**.`,
  },
];

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArticleId?: string;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  initialArticleId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialArticleId || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Categorias únicas
  const categories = useMemo(() => {
    const cats = Array.from(new Set(DOC_ARTICLES.map((a) => a.category)));
    return ['todos', ...cats];
  }, []);

  // Filtragem de artigos pela busca e categoria
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return DOC_ARTICLES.filter((article) => {
      const matchCategory = selectedCategory === 'todos' || article.category === selectedCategory;
      if (!matchCategory) return false;
      if (!q) return true;

      const inTitle = article.title.toLowerCase().includes(q);
      const inDesc = article.description.toLowerCase().includes(q);
      const inContent = article.content.toLowerCase().includes(q);
      const inTags = article.tags.some((t) => t.toLowerCase().includes(q));

      return inTitle || inDesc || inContent || inTags;
    });
  }, [searchQuery, selectedCategory]);

  const activeArticle = useMemo(() => {
    if (!selectedArticleId) return null;
    return DOC_ARTICLES.find((a) => a.id === selectedArticleId) || null;
  }, [selectedArticleId]);

  if (!isOpen) return null;

  const handleCopyLink = (article: DocArticle) => {
    navigator.clipboard.writeText(window.location.origin + `/ajuda?artigo=${article.id}`);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Cabeçalho da Central de Ajuda */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Central de Ajuda & Documentação
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Átomos Infinity
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guias detalhados, tutoriais de criação e respostas para todas as suas dúvidas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar Ajuda"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Busca de Assuntos e Filtros */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar assunto (ex: QR Code, WhatsApp, Foto, PIX, IA, Cores)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Categorias / Chips */}
          <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'todos' ? 'Todos os Assuntos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Corpo Principal: Lista e Visualizador de Artigo */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Coluna Esquerda: Lista de Artigos / Tópicos */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-3 sm:p-4 space-y-2 ${
              activeArticle ? 'hidden md:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Documentos ({filteredArticles.length})
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pasta <code className="text-sky-600 dark:text-sky-400 font-mono">/doc</code>
              </span>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <HelpCircle size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Nenhum assunto encontrado
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tente buscar por termos mais genéricos como "cartão", "logo" ou "contato".
                </p>
              </div>
            ) : (
              filteredArticles.map((art) => {
                const Icon = art.icon;
                const isSelected = selectedArticleId === art.id;
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold uppercase text-sky-600 dark:text-sky-400">
                          {art.category}
                        </span>
                        <code className="text-[9px] text-slate-400 font-mono">{art.filename}</code>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {art.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Coluna Direita: Conteúdo do Artigo Selecionado */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-8 bg-white dark:bg-slate-900 ${activeArticle ? 'block' : 'hidden md:flex md:items-center md:justify-center'}`}>
            {activeArticle ? (
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Barra superior do artigo para mobile (voltar) */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedArticleId(null)}
                    className="md:hidden flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Voltar aos tópicos</span>
                  </button>

                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Arquivo:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700">
                      /doc/{activeArticle.filename}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(activeArticle)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedId === activeArticle.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedId === activeArticle.id ? 'Copiado!' : 'Copiar Referência'}</span>
                    </button>
                  </div>
                </div>

                {/* Renderização do Artigo Markdown Estruturado */}
                <article className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
                  <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 mb-6">
                    <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-bold text-xs mb-1">
                      <Sparkles size={15} />
                      <span>Resumo Rápido</span>
                    </div>
                    <p className="text-xs text-sky-900 dark:text-sky-200 m-0">
                      {activeArticle.description}
                    </p>
                  </div>

                  {/* Artigo Formatado com Renderizador Visual */}
                  <div className="space-y-4 font-normal">
                    {activeArticle.content.split('\n\n').map((block, idx) => {
                      if (block.startsWith('# ')) {
                        return (
                          <h1 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                            {block.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (block.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-lg font-extrabold text-slate-900 dark:text-white mt-6 mb-2">
                            {block.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (block.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-base font-bold text-sky-700 dark:text-sky-300 mt-4 mb-1">
                            {block.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (block.startsWith('- ') || block.startsWith('* ')) {
                        return (
                          <ul key={idx} className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                            {block.split('\n').map((line, lIdx) => (
                              <li key={lIdx} dangerouslySetInnerHTML={{
                                __html: line.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs">$1</code>')
                              }} />
                            ))}
                          </ul>
                        );
                      }
                      if (/^\d+\./.test(block)) {
                        return (
                          <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm">
                            {block.split('\n').map((line, lIdx) => (
                              <li key={lIdx} dangerouslySetInnerHTML={{
                                __html: line.replace(/^\d+\.\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs">$1</code>')
                              }} />
                            ))}
                          </ol>
                        );
                      }
                      return (
                        <p
                          key={idx}
                          className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: block
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-sky-600 dark:text-sky-400">$1</code>')
                          }}
                        />
                      );
                    })}
                  </div>
                </article>

                {/* Box de Suporte no Rodapé do Artigo */}
                <div className="mt-10 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Ainda ficou com alguma dúvida sobre este assunto?
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Nossa equipe de especialistas da Átomos Infinity está à disposição.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/5515996259353?text=Ol%C3%A1%2C%20estou%20com%20uma%20d%C3%BAvida%20sobre%20a%20cria%C3%A7%C3%A3o%20do%20cart%C3%A3o%20digital"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
                  >
                    <MessageSquare size={14} />
                    <span>Falar no WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Selecione um tópico de ajuda
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Utilize o menu à esquerda ou a barra de busca acima para encontrar explicações detalhadas sobre qualquer funcionalidade do software.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
