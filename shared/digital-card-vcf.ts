export interface VCardInput {
  name: string;
  brandName?: string;
  jobTitle?: string;
  phone?: string;
  whatsappPhone?: string;
  email?: string;
  websiteUrl?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  slug?: string;
}

/**
 * Gera arquivo vCard .vcf compatível com iOS e Android (versão 3.0)
 */
export function generateVCardString(card: VCardInput): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${(card.name || '').trim()}`,
  ];

  if (card.brandName?.trim()) {
    lines.push(`ORG:${card.brandName.trim()}`);
  }

  if (card.jobTitle?.trim()) {
    lines.push(`TITLE:${card.jobTitle.trim()}`);
  }

  if (card.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL:${card.phone.trim()}`);
  }

  if (card.whatsappPhone?.trim()) {
    const rawNumber = card.whatsappPhone.replace(/\D/g, '');
    lines.push(`TEL;TYPE=CELL;WAID=${rawNumber}:${card.whatsappPhone.trim()}`);
  }

  if (card.email?.trim()) {
    lines.push(`EMAIL:${card.email.trim()}`);
  }

  if (card.websiteUrl?.trim()) {
    lines.push(`URL:${card.websiteUrl.trim()}`);
  }

  const addrParts = [
    (card.address || '').trim(),
    (card.addressNumber || '').trim(),
  ].filter(Boolean).join(', ');

  if (addrParts || card.city || card.state || card.country) {
    const street = addrParts;
    const city = (card.city || '').trim();
    const state = (card.state || '').trim();
    const country = (card.country || '').trim();
    lines.push(`ADR;TYPE=WORK:;;${street};${city};${state};;${country}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Dispara o download de um arquivo .vcf diretamente no navegador
 */
export function downloadVCard(card: VCardInput): void {
  const vcard = generateVCardString(card);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${card.slug || 'contato'}.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
