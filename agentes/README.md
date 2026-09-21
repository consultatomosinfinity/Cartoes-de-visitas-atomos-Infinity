# Base de Conhecimento do Agente Átomos (Átomos Infinity)

Esta pasta contém a base de conhecimento completa e estruturada em arquivos Markdown (`.md`) para o **Átomos**, o Agente de Atendimento e Vendas com Inteligência Artificial da **Átomos Infinity**.

---

## 📂 Estrutura de Arquivos da Base de Conhecimento

1. **`PROMPT_SISTEMA_JOTFORM_AGENT.md`**
   👉 *Prompt Mestre pronto para copiar e colar no Construtor de Agentes de IA da Jotform (Jotform AI Agent Builder) ou em modelos Gemini / NVIDIA.*
2. **`01_perfil_e_missao_atomos.md`**
   👉 *Identidade, tom de voz, personalidade de vendedor perspicaz e princípios éticos do Átomos.*
3. **`02_produtos_e_recursos.md`**
   👉 *Detalhamento completo do Cartão Digital Interativo, PWA, vCard, QR Code dinâmico, PIX, Avaliação Google, Horários e customizações.*
4. **`03_vantagens_agente_ia_no_cartao.md`**
   👉 *Argumentário persuasivo para atrair o cliente a contratar um Atendente IA dedicado no seu próprio cartão digital.*
5. **`04_planos_precos_e_pagamento.md`**
   👉 *Tabela de preços (Profissional, Negócios & IA, Corporativo), ciclos (Trimestral, Semestral, Anual), descontos e meios de pagamento (PIX, Cartão).*
6. **`05_formulario_coleta_express.md`**
   👉 *Guia do Formulário de Coleta Express (`/onboarding`), dados solicitados e orientações de preenchimento em 2 minutos.*
7. **`06_faq_e_quebra_de_objecoes.md`**
   👉 *Perguntas e respostas frequentes, resolução de dúvidas técnicas e estratégias de quebra de objeções de vendas.*
8. **`07_canais_de_atendimento_e_contatos.md`**
   👉 *Canais oficiais de suporte, WhatsApp dos consultores e procedimentos de transição para atendimento humano.*
9. **`08_estilo_de_conversa_chat_voz_email.md`**
   👉 *Configurações e diretrizes prontas (mínimo de 4 a 5 regras por canal) para preencher a aba "Estilo de Conversa" no Jotform para Chat, Voz e E-mail.*

---

## 🤖 Como Utilizar no Construtor de Agentes da Jotform (Jotform AI Agent)

1. Acesse o **Jotform AI Agent Builder** (https://www.jotform.com/ai/agent-builder/).
2. No campo de **System Prompt (Instruções do Sistema)**, copie e cole o conteúdo do arquivo `PROMPT_SISTEMA_JOTFORM_AGENT.md`.
3. Na seção de **Knowledge Base (Base de Conhecimento)** do Jotform, faça o upload ou adicione o texto dos arquivos `01` a `07`.
4. Na aba **Estilo de Conversa (Conversation Style)**, utilize as diretrizes e configurações detalhadas em `08_estilo_de_conversa_chat_voz_email.md` para as abas *Bater papo*, *Voz* e *E-mail*.
5. Configure o nome do Agente como **Átomos - Consultor Inteligente Átomos Infinity**.
5. Para publicar no site ou em páginas externas, utilize o código de incorporação (Embed Script):
   ```html
   <script src='https://cdn.jotfor.ms/agent/embedjs/01a0bfa1d8107000848905e7ba8cb2c582a4/embed.js'></script>
   ```

---

## 🔮 Futura Integração com APIs Gemini & NVIDIA

Estes arquivos foram formatados no padrão universal de RAG (Retrieval-Augmented Generation) e System Instructions:
- Compatíveis com `@google/genai` (Gemini 2.5 / Gemini Flash)
- Compatíveis com NVIDIA NIM (Llama-3.3-70b-instruct, Nemotron)
- Podem ser lidos programaticamente via backend Express/Node.js para alimentar rotas `/api/ai/chat` internas assim que as chaves de API forem inseridas.
