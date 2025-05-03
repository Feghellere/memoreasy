import { createClient } from '@supabase/supabase-js';

// Obter URL e chave anônima do ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de valores
if (!supabaseUrl) {
  console.error('URL do Supabase não configurada nas variáveis de ambiente');
  throw new Error('URL do Supabase não configurada. Configure a variável de ambiente VITE_SUPABASE_URL.');
}

if (!supabaseAnonKey) {
  console.error('Chave anônima do Supabase não configurada nas variáveis de ambiente');
  throw new Error('Chave anônima do Supabase não configurada. Configure a variável de ambiente VITE_SUPABASE_ANON_KEY.');
}

// Criar o cliente Supabase com configurações explícitas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'memoreasy-auth-storage',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Ouvir mudanças no estado de autenticação (logs apenas em desenvolvimento)
supabase.auth.onAuthStateChange((event, session) => {
  if (import.meta.env.DEV) {
    console.log('Evento de autenticação:', event, session ? 'Sessão ativa' : 'Sem sessão');
    
    // Diagnosticar estado de autenticação
    if (session) {
      console.log('Token JWT disponível:', !!session.access_token);
    } else {
      console.warn('Sem sessão de usuário ativa');
    }
  }
});

// Função de diagnóstico que pode ser chamada para verificar o estado da autenticação
export const verificarAutenticacao = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao verificar sessão:', error);
      }
      return false;
    }
    
    if (!data.session) {
      if (import.meta.env.DEV) {
        console.warn('Sessão não encontrada');
      }
      return false;
    }
    
    // Log apenas em ambiente de desenvolvimento
    if (import.meta.env.DEV && data.session.expires_at) {
      console.log('Sessão válida encontrada, expira em:', 
        new Date(data.session.expires_at * 1000).toLocaleString());
    }
    
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Exceção ao verificar autenticação:', error);
    }
    return false;
  }
};