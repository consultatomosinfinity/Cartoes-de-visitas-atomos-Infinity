/**
 * Utilitários para geração de Payload PIX padrão Banco Central (BACEN / BR Code EMV)
 * e formatação de chaves PIX.
 */

// Remove acentos e caracteres especiais para compatibilidade com o padrão EMV
export function sanitizePixText(text: string, maxLength: number): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, '') // remove pontuações especiais
    .toUpperCase()
    .trim();

  return normalized.substring(0, maxLength);
}

// Formata Tag EMV: ID (2 dígitos) + Tamanho (2 dígitos) + Valor
function formatEmvTag(id: string, value: string): string {
  const length = String(value.length).padStart(2, '0');
  return `${id}${length}${value}`;
}

// Cálculo de CRC16 CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF)
function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export type PixKeyType = 'telefone' | 'email' | 'cpf' | 'cnpj' | 'aleatoria' | string;

export interface PixPayloadOptions {
  pixKey: string;
  pixType?: PixKeyType;
  pixBeneficiary?: string;
  pixCity?: string;
  amount?: number;
  txId?: string;
}

/**
 * Normaliza a chave PIX para inserção no payload do Banco Central
 */
export function normalizePixKeyForPayload(key: string, type?: string): string {
  const clean = key.trim();
  if (!clean) return '';

  if (type === 'telefone' || (!type && /^\+?[0-9\s()-]+$/.test(clean) && clean.replace(/\D/g, '').length >= 10 && clean.replace(/\D/g, '').length <= 11)) {
    let digits = clean.replace(/\D/g, '');
    if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
      digits = `55${digits}`;
    }
    return `+${digits}`;
  }

  if (type === 'cpf' || type === 'cnpj') {
    return clean.replace(/\D/g, '');
  }

  if (type === 'email') {
    return clean.toLowerCase();
  }

  return clean;
}

/**
 * Formata chave PIX para exibição amigável ao usuário
 */
export function formatPixKeyForDisplay(key: string, type?: string): string {
  const clean = (key || '').trim();
  if (!clean) return '';

  const digits = clean.replace(/\D/g, '');

  if (type === 'cpf' || (!type && digits.length === 11 && !clean.includes('@'))) {
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  }

  if (type === 'cnpj' || (!type && digits.length === 14)) {
    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  }

  if (type === 'telefone' || (!type && (digits.length === 10 || digits.length === 11 || (digits.startsWith('55') && digits.length <= 13)))) {
    let num = digits;
    if (num.startsWith('55') && num.length > 11) {
      num = num.substring(2);
    }
    if (num.length === 11) {
      return num.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (num.length === 10) {
      return num.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
  }

  return clean;
}

/**
 * Gera a string EMV padrão BR Code (PIX Copia e Cola)
 */
export function generatePixBrCodePayload(options: PixPayloadOptions): string {
  const {
    pixKey,
    pixType = 'telefone',
    pixBeneficiary = 'RECEBEDOR',
    pixCity = 'BRASIL',
    amount,
    txId = '***',
  } = options;

  const normalizedKey = normalizePixKeyForPayload(pixKey, pixType);
  if (!normalizedKey) return '';

  const cleanBeneficiary = sanitizePixText(pixBeneficiary || 'RECEBEDOR', 25) || 'RECEBEDOR';
  const cleanCity = sanitizePixText(pixCity || 'BRASIL', 15) || 'BRASIL';
  const cleanTxId = sanitizePixText(txId || '***', 25) || '***';

  // 00: Payload Format Indicator
  let payload = formatEmvTag('00', '01');

  // 26: Merchant Account Information (PIX)
  const gui = formatEmvTag('00', 'BR.GOV.BCB.PIX');
  const keyTag = formatEmvTag('01', normalizedKey);
  payload += formatEmvTag('26', `${gui}${keyTag}`);

  // 52: Merchant Category Code
  payload += formatEmvTag('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatEmvTag('53', '986');

  // 54: Transaction Amount (opcional)
  if (amount && amount > 0) {
    payload += formatEmvTag('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += formatEmvTag('58', 'BR');

  // 59: Merchant Name
  payload += formatEmvTag('59', cleanBeneficiary);

  // 60: Merchant City
  payload += formatEmvTag('60', cleanCity);

  // 62: Additional Data Field (txId)
  const txTag = formatEmvTag('05', cleanTxId);
  payload += formatEmvTag('62', txTag);

  // 63: CRC16
  const payloadWithCrcTag = `${payload}6304`;
  const crc = calculateCrc16(payloadWithCrcTag);

  return `${payloadWithCrcTag}${crc}`;
}
