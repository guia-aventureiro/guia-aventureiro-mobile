// mobile/src/platform/storage.web.ts
// Armazenamento de tokens — implementação web (localStorage).
// O bundler web escolhe este arquivo automaticamente no lugar de storage.ts.
// Nota de segurança: localStorage é legível por XSS. O access token curto (15min)
// limita a janela de exposição; CSP estrita é aplicada no HTML servido.

const normalize = (value?: string | null): string | null => {
  const normalized = (value || '').trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return null;
  }
  return normalized;
};

const getStore = (): Storage | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    return normalize(getStore()?.getItem(key));
  } catch {
    return null;
  }
};

export const setSecureItem = async (key: string, value: string): Promise<void> => {
  try {
    const store = getStore();
    if (!store) {
      return;
    }

    const sanitized = normalize(value);
    if (!sanitized) {
      store.removeItem(key);
      return;
    }

    store.setItem(key, sanitized);
  } catch {
    // Falha de escrita (ex.: modo privado) não deve derrubar o app
  }
};

export const deleteSecureItem = async (key: string): Promise<void> => {
  try {
    getStore()?.removeItem(key);
  } catch {
    // Falha de limpeza não deve derrubar o app
  }
};
