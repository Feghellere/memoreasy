import { createContext, useContext, useEffect, useState } from 'react';
import { Usuario } from '../tipos/autenticacao';
import { supabase } from '../lib/supabaseClient';

interface ContextoAutenticacao {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  cadastrar: (email: string, senha: string, nome: string) => Promise<void>;
}

const AutenticacaoContexto = createContext<ContextoAutenticacao | undefined>(undefined);

export function AutenticacaoProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUsuario({
          id: session.user.id,
          email: session.user.email!,
          nome: session.user.user_metadata.nome,
          criadoEm: new Date(session.user.created_at),
        });
      } else {
        setUsuario(null);
      }
      setCarregando(false);
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUsuario({
          id: session.user.id,
          email: session.user.email!,
          nome: session.user.user_metadata.nome,
          criadoEm: new Date(session.user.created_at),
        });
      } else {
        setUsuario(null);
      }
      setCarregando(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const entrar = async (email: string, senha: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao entrar:', error);
      throw error;
    }
  };

  const cadastrar = async (email: string, senha: string, nome: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      throw error;
    }
  };

  const sair = async () => {
    try {
      // Primeiro, limpa o estado do usuário
      setUsuario(null);
      
      // Então, faz o signOut do Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Limpa qualquer dado em cache do Supabase
      await supabase.auth.clearSession();
      
      // Força uma atualização do estado da sessão
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        throw new Error('Falha ao limpar sessão');
      }

    } catch (error) {
      console.error('Erro ao sair:', error);
      // Mesmo com erro, mantém o usuário deslogado localmente
      setUsuario(null);
      throw error;
    }
  };

  return (
    <AutenticacaoContexto.Provider value={{ usuario, carregando, entrar, sair, cadastrar }}>
      {children}
    </AutenticacaoContexto.Provider>
  );
}

export function useAutenticacao() {
  const context = useContext(AutenticacaoContexto);
  if (context === undefined) {
    throw new Error('useAutenticacao deve ser usado dentro de um AutenticacaoProvider');
  }
  return context;
}