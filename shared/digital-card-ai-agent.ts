export interface ParsedAiAgent {
  /** URL limpa para navegação direta (abrir em nova aba) */
  url: string;
  /** URL otimizada para renderização em <iframe> */
  embedUrl: string;
  /** Verdadeiro se o agente é do Jotform */
  isJotform: boolean;
  /** ID do agente Jotform, se detectado */
  agentId?: string;
}

/**
 * Analisa qualquer formato de entrada de Agente de IA:
 * - Link direto (ex.: https://agent.jotform.com/01a09d762200700084da8228d24ba4964d8b)
 * - Tag <iframe src="..."> do Jotform ou de outra ferramenta
 * - Tag <script src="https://cdn.jotfor.ms/agent/embedjs/.../embed.js">
 *
 * Retorna a URL limpa de navegação e a URL configurada para renderização
 * em iframe responsivo, ou null se a entrada for inválida.
 */
export function parseAiAgentInput(raw: unknown): ParsedAiAgent | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return null;

  // Caso 1: Script embed do JotForm (<script src='https://cdn.jotfor.ms/agent/embedjs/ID/embed.js'>)
  const scriptMatch = text.match(/cdn\.jotfor\.ms\/agent\/embedjs\/([a-zA-Z0-9_-]+)/i);
  if (scriptMatch) {
    const id = scriptMatch[1];
    return {
      url: `https://agent.jotform.com/${id}`,
      embedUrl: `https://agent.jotform.com/${id}?embedMode=iframe&autofocus=1&background=1&shadow=1`,
      isJotform: true,
      agentId: id,
    };
  }

  // Caso 2: Código <iframe> com src="..."
  const iframeMatch = text.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeMatch) {
    const src = iframeMatch[1];
    try {
      const parsed = new URL(src);
      const isJotform = parsed.hostname.includes("jotform.com");
      if (isJotform) {
        parsed.searchParams.set("embedMode", "iframe");
        parsed.searchParams.set("background", "1");
        parsed.searchParams.set("shadow", "1");
      }
      return {
        url: src,
        embedUrl: parsed.href,
        isJotform,
        agentId: isJotform
          ? parsed.pathname.split("/").filter(Boolean).pop()
          : undefined,
      };
    } catch {
      // continua para tentar extrair URL do texto
    }
  }

  // Caso 3: URL pura (ou contida no texto)
  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlMatch) {
    const rawUrl = urlMatch[0];
    try {
      const parsed = new URL(rawUrl);
      const isJotform = parsed.hostname.includes("jotform.com");
      if (isJotform) {
        const id = parsed.pathname.split("/").filter(Boolean).pop();
        parsed.searchParams.set("embedMode", "iframe");
        parsed.searchParams.set("background", "1");
        parsed.searchParams.set("shadow", "1");
        return {
          url: rawUrl,
          embedUrl: parsed.href,
          isJotform: true,
          agentId: id,
        };
      }
      return {
        url: rawUrl,
        embedUrl: rawUrl,
        isJotform: false,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Normaliza o valor bruto do campo aiAgentUrl para a URL canônica.
 * Retorna string vazia se a entrada for inválida.
 * Usar no servidor antes de salvar no banco.
 */
export function normalizeAiAgentInput(raw: unknown): string {
  const parsed = parseAiAgentInput(raw);
  return parsed ? parsed.url : "";
}

export type AiAgentGlowIntensity = 'suave' | 'medio' | 'intenso';
export type AiAgentButtonSize = 'fino' | 'padrao' | 'espesso' | 'extra';

export function getAiAgentButtonGlowClass(glowEnabled?: boolean, intensity?: string): string {
  if (glowEnabled === false) return '';
  switch (intensity) {
    case 'suave':
      return 'ai-button-glow-suave';
    case 'intenso':
      return 'ai-button-glow-intenso';
    case 'medio':
    default:
      return 'ai-button-glow-medio';
  }
}

export function getAiAgentButtonPaddingY(size?: string, customPaddingY?: number): number {
  if (typeof customPaddingY === 'number' && customPaddingY >= 4 && customPaddingY <= 32) {
    return customPaddingY;
  }
  switch (size) {
    case 'fino':
      return 8;
    case 'espesso':
      return 16;
    case 'extra':
      return 20;
    case 'padrao':
    default:
      return 12;
  }
}

