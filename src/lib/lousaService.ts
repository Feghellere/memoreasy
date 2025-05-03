import { supabase } from './supabaseClient';
import type { ElementoLousa } from '../tipos/lousa';

export interface Lousa {
  id?: string;
  user_id?: string;
  titulo: string;
  descricao?: string;
  conteudo: ElementoLousa[];
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
}

export const lousaService = {
  /**
   * Busca todas as lousas do usuário atual
   */
  async listarLousas() {
    try {
      if (import.meta.env.DEV) {
        console.log('Listando lousas do usuário');
      }

      const { data, error } = await supabase
        .from('lousas')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar lousas:', error.code, error.message);
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log(`${data?.length || 0} lousas encontradas`);
      }
      
      return data as Lousa[];
    } catch (error) {
      console.error('Exceção ao listar lousas');
      throw error;
    }
  },
  
  /**
   * Busca uma lousa específica por ID
   */
  async obterLousa(id: string) {
    try {
      if (import.meta.env.DEV) {
        console.log('Buscando lousa com ID:', id);
      }
      
      // Verificar se o usuário está autenticado
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Erro de autenticação ao obter lousa:', authError.message);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!authData.session) {
        console.error('Usuário não autenticado ao obter lousa');
        throw new Error('Você precisa estar autenticado para visualizar a lousa');
      }
      
      const { data, error } = await supabase
        .from('lousas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar lousa:', error.code, error.message);
        throw error;
      }
      
      if (!data) {
        console.error('Lousa não encontrada');
        throw new Error('Lousa não encontrada');
      }
      
      if (import.meta.env.DEV) {
        console.log('Lousa encontrada:', { 
          id: data.id, 
          titulo: data.titulo,
          temConteudo: !!data.conteudo?.length
        });
      }
      
      // Garantir que conteúdo seja um array válido
      if (!data.conteudo) {
        data.conteudo = [];
      }
      
      return data as Lousa;
    } catch (error) {
      console.error('Exceção ao obter lousa');
      throw error;
    }
  },
  
  /**
   * Cria uma nova lousa
   */
  async criarLousa(lousa: Omit<Lousa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      // Verificar se o usuário está autenticado
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Erro de autenticação:', authError.message);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!authData.session) {
        console.error('Usuário não autenticado');
        throw new Error('Você precisa estar autenticado para salvar a lousa');
      }
      
      // Obter o ID do usuário atual
      const userId = authData.session.user.id;
      
      if (import.meta.env.DEV) {
        console.log('Criando lousa para o usuário:', userId);
      }
      
      // Incluir user_id explicitamente (isso é crucial para a política RLS)
      const dadosComUserId = {
        ...lousa,
        user_id: userId
      };
      
      const { data, error } = await supabase
        .from('lousas')
        .insert(dadosComUserId)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar lousa:', error.code, error.message);
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('Lousa criada com ID:', data?.id);
      }
      
      return data as Lousa;
    } catch (error) {
      console.error('Exceção ao criar lousa');
      throw error;
    }
  },
  
  /**
   * Atualiza uma lousa existente
   */
  async atualizarLousa(id: string, lousa: Partial<Omit<Lousa, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    try {
      // Verificar se o usuário está autenticado
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Erro de autenticação:', authError.message);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!authData.session) {
        console.error('Usuário não autenticado');
        throw new Error('Você precisa estar autenticado para atualizar a lousa');
      }
      
      if (import.meta.env.DEV) {
        console.log('Atualizando lousa com ID:', id);
      }
      
      const { data, error } = await supabase
        .from('lousas')
        .update(lousa)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar lousa:', error.code, error.message);
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('Lousa atualizada com sucesso');
      }
      
      return data as Lousa;
    } catch (error) {
      console.error('Exceção ao atualizar lousa');
      throw error;
    }
  },
  
  /**
   * Atualiza apenas o conteúdo da lousa
   */
  async atualizarConteudoLousa(id: string, conteudo: ElementoLousa[]) {
    return this.atualizarLousa(id, { conteudo });
  },
  
  /**
   * Atualiza apenas a thumbnail da lousa
   */
  async atualizarThumbnailLousa(id: string, thumbnail: string) {
    return this.atualizarLousa(id, { thumbnail });
  },
  
  /**
   * Exclui uma lousa
   */
  async excluirLousa(id: string) {
    try {
      if (import.meta.env.DEV) {
        console.log('Excluindo lousa com ID:', id);
      }
      
      const { error } = await supabase
        .from('lousas')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir lousa:', error.code, error.message);
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('Lousa excluída com sucesso');
      }
      
      return true;
    } catch (error) {
      console.error('Exceção ao excluir lousa');
      throw error;
    }
  }
}; 