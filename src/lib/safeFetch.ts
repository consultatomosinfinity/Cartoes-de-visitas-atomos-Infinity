// Utilitário para chamadas de API seguras que previnem erros de JSON quando o servidor Express
// não está rodando (ex: em deploys estáticos no Vercel).

export async function safeApiCall(url: string, options?: RequestInit, fallbackData: any = null): Promise<any> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    
    if (!res.ok || contentType.includes('text/html') || text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
      return fallbackData;
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallbackData;
    }
  } catch (err) {
    return fallbackData;
  }
}

export async function safeApiMutate(url: string, options?: RequestInit): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    
    if (!res.ok || contentType.includes('text/html') || text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
      return { success: false, error: 'Servidor de API não disponível neste ambiente estático (Vercel). As alterações foram salvas localmente.' };
    }
    
    try {
      const json = JSON.parse(text);
      return { success: true, data: json };
    } catch (e) {
      return { success: false, error: 'Resposta inválida do servidor.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de conexão com o servidor.' };
  }
}
