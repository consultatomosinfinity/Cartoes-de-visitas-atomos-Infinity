import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { SystemSettings } from '../types.ts';
import { getRemoteSystemSettings, DEFAULT_SYSTEM_SETTINGS } from '../lib/supabase.ts';

const SCRIPT_ELEMENT_ID = 'atomos-dynamic-chatbot-script';
const DEFAULT_JOTFORM_SCRIPT = DEFAULT_SYSTEM_SETTINGS.chatbotScriptUrl || 'https://cdn.jotfor.ms/agent/embedjs/01a0c0ce84b870008af657718192cda49e69/embed.js';

function extractScriptSrc(scriptUrl?: string, embedCode?: string): string | null {
  if (scriptUrl && scriptUrl.trim()) {
    return scriptUrl.trim();
  }
  if (embedCode && embedCode.trim()) {
    const match = embedCode.match(/src=['"]([^'"]+)['"]/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export function DynamicChatbotLoader() {
  const [location] = useLocation();
  const [settings, setSettings] = useState<SystemSettings | null>(() => {
    try {
      const cached = localStorage.getItem('atomos_system_settings');
      return cached ? JSON.parse(cached) : DEFAULT_SYSTEM_SETTINGS;
    } catch {
      return DEFAULT_SYSTEM_SETTINGS;
    }
  });

  const loadSettings = async () => {
    try {
      const remote = await getRemoteSystemSettings();
      if (remote) {
        setSettings(remote);
      }
    } catch {
      // Ignora erro e usa fallback
    }
  };

  useEffect(() => {
    loadSettings();

    const handleSettingsUpdated = (e: CustomEvent<SystemSettings>) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        loadSettings();
      }
    };

    window.addEventListener('atomos_system_settings_updated' as any, handleSettingsUpdated);
    return () => {
      window.removeEventListener('atomos_system_settings_updated' as any, handleSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    // Determina se o chatbot deve ser exibido nesta rota
    const isEnabled = settings ? settings.chatbotEnabled !== false : true;
    const targetScript = extractScriptSrc(settings?.chatbotScriptUrl, settings?.chatbotEmbedCode) || DEFAULT_JOTFORM_SCRIPT;
    const pagesOption = settings?.chatbotPages || 'all';

    let shouldShowOnPage = true;
    const path = location || window.location.pathname;

    if (pagesOption === 'landing_only') {
      shouldShowOnPage = path === '/' || path === '';
    } else if (pagesOption === 'cards_only') {
      shouldShowOnPage = path.startsWith('/cartao') || path.startsWith('/degustador');
    } else if (pagesOption === 'landing_and_cards') {
      shouldShowOnPage = path === '/' || path.startsWith('/cartao') || path.startsWith('/degustador') || path.startsWith('/formulario');
    }

    const existingScript = document.getElementById(SCRIPT_ELEMENT_ID) as HTMLScriptElement | null;

    if (!isEnabled || !shouldShowOnPage || !targetScript) {
      // Remover script se existir
      if (existingScript) {
        existingScript.remove();
      }
      // Ocultar qualquer widget injetado pelo Jotform
      const jotformContainers = document.querySelectorAll('iframe[id*="jotform"], div[id*="jotform-agent"], div[class*="jotform-agent"]');
      jotformContainers.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
      return;
    }

    // Se o script já está no DOM com o mesmo src, garante que os elementos estejam visíveis
    if (existingScript && existingScript.src === targetScript) {
      const jotformContainers = document.querySelectorAll('iframe[id*="jotform"], div[id*="jotform-agent"], div[class*="jotform-agent"]');
      jotformContainers.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
      return;
    }

    // Se o src mudou, remove o script antigo e recarrega
    if (existingScript) {
      existingScript.remove();
      const jotformContainers = document.querySelectorAll('iframe[id*="jotform"], div[id*="jotform-agent"], div[class*="jotform-agent"]');
      jotformContainers.forEach((el) => el.remove());
    }

    // Injeta novo script dinâmico
    try {
      const script = document.createElement('script');
      script.id = SCRIPT_ELEMENT_ID;
      script.src = targetScript;
      script.async = true;
      document.body.appendChild(script);
    } catch (e) {
      console.error('Erro ao injetar script do chatbot:', e);
    }
  }, [settings, location]);

  return null;
}
