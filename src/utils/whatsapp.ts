/**
 * Utilitário para envio confiável de mensagens para o WhatsApp
 * Evita o bug de decodificação de caracteres/emojis corrompidos () no WhatsApp Web e wa.me
 */

export function sanitizeWhatsAppText(text: string): string {
  if (!text) return '';

  return text
    // Substitui emojis de 4-bytes e sequências problemáticas que o WhatsApp Web / wa.me decodifica como 
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (match) => {
      // Mapeia emojis comuns para símbolos limpos e seguros
      switch (match) {
        case '👋': return '';
        case '✨': return '✦';
        case '🚀': return '▶';
        case '🔗': return '➤';
        case '📲': return '•';
        case '💼': return '■';
        case '💳': return '•';
        case '🔑': return '•';
        case '👤': return '•';
        case '🌐': return '➤';
        case '📢': return '●';
        case '⚠️': return '(!)';
        case '✅': return '✓';
        case '⭐': return '★';
        case '👍': return '✓';
        case '😊': return ':)';
        default: return '';
      }
    })
    // Remove caracteres nulos ou de controle inválidos
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF]/g, '')
    // Normaliza quebras de linha múltiplas excessivas
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Gera URL direta para o WhatsApp API sem passar por redirecionamento 302 com perda de charset
 */
export function buildWhatsAppUrl(phone?: string, text?: string): string {
  const cleanMsg = sanitizeWhatsAppText(text || '');
  const encodedMsg = encodeURIComponent(cleanMsg);

  let cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone && !cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
    cleanPhone = `55${cleanPhone}`;
  }

  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMsg}`;
}

/**
 * Abre o WhatsApp em nova aba com o texto sanitizado
 */
export function openWhatsApp(phone?: string, text?: string) {
  const url = buildWhatsAppUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}
