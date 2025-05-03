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
    const { data, error } = await supabase
      .from('lousas')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar lousas:', error);
      throw error;
    }
    
    return data as Lousa[];
  },
  
  /**
   * Busca uma lousa específica por ID
   */
  async obterLousa(id: string) {
    const { data, error } = await supabase
      .from('lousas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar lousa:', error);
      throw error;
    }
    
    return data as Lousa;
  },
  
  /**
   * Cria uma nova lousa
   */
  async criarLousa(lousa: Omit<Lousa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('lousas')
      .insert(lousa)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar lousa:', error);
      throw error;
    }
    
    return data as Lousa;
  },
  
  /**
   * Atualiza uma lousa existente
   */
  async atualizarLousa(id: string, lousa: Partial<Omit<Lousa, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('lousas')
      .update(lousa)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar lousa:', error);
      throw error;
    }
    
    return data as Lousa;
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
    const { error } = await supabase
      .from('lousas')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir lousa:', error);
      throw error;
    }
    
    return true;
  }
}; 