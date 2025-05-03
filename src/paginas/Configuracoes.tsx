import { useState, useRef, ChangeEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAutenticacao } from '../contexto/AutenticacaoContexto';
import { Camera, CheckCircle2, FileImage, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface OutletContextType {
  darkMode: boolean;
}

const Configuracoes = () => {
  const { darkMode } = useOutletContext<OutletContextType>();
  const { usuario, atualizarPerfil } = useAutenticacao();
  const [nome, setNome] = useState(usuario?.nome || '');
  const [fotoUrl, setFotoUrl] = useState(usuario?.fotoUrl || '');
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [salvando, setSalvando] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const handleFotoClick = () => {
    if (fotoInputRef.current) {
      fotoInputRef.current.click();
    }
  };

  const handleFotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      return;
    }

    try {
      setCarregandoFoto(true);
      const file = files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${usuario?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `fotos_perfil/${fileName}`;

      // Upload da foto para o Storage do Supabase
      const { error: uploadError } = await supabase.storage
        .from('usuarios')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública da foto
      const { data } = supabase.storage
        .from('usuarios')
        .getPublicUrl(filePath);

      setFotoUrl(data.publicUrl);
    } catch (error: any) {
      setMensagem({ 
        texto: error.message || 'Erro ao fazer upload da imagem', 
        tipo: 'erro' 
      });
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000);
    } finally {
      setCarregandoFoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSalvando(true);
      
      // Verificar se houve alterações nos dados
      if (nome === usuario?.nome && fotoUrl === usuario?.fotoUrl) {
        setMensagem({ 
          texto: 'Nenhuma alteração detectada', 
          tipo: 'info' 
        });
        setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000);
        return;
      }

      // Atualizar o perfil usando a função do contexto
      await atualizarPerfil({
        nome: nome !== usuario?.nome ? nome : undefined,
        fotoUrl: fotoUrl !== usuario?.fotoUrl ? fotoUrl : undefined
      });

      setMensagem({ 
        texto: 'Perfil atualizado com sucesso!', 
        tipo: 'sucesso' 
      });
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000);
    } catch (error: any) {
      setMensagem({ 
        texto: error.message || 'Erro ao atualizar perfil', 
        tipo: 'erro' 
      });
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div 
      className={`max-w-4xl mx-auto px-4 py-8 ${
        darkMode ? 'text-white' : 'text-gray-800'
      }`}
    >
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Configurações de Perfil</h1>
      
      <div 
        className={`rounded-xl p-6 mb-8 ${
          darkMode 
            ? 'bg-[#1e293b] border border-gray-700' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Seção da foto */}
            <div className="flex flex-col items-center gap-4">
              <div 
                className={`
                  relative w-32 h-32 cursor-pointer overflow-hidden rounded-full
                  ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}
                  border-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}
                  transition-all hover:opacity-90
                `}
                onClick={handleFotoClick}
              >
                {fotoUrl ? (
                  <img 
                    src={fotoUrl} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <User 
                      size={48}
                      className={darkMode ? 'text-gray-400' : 'text-gray-500'} 
                    />
                  </div>
                )}
                
                {/* Overlay */}
                <div 
                  className={`
                    absolute inset-0 flex items-center justify-center bg-black bg-opacity-50
                    ${carregandoFoto ? 'opacity-100' : 'opacity-0 hover:opacity-70'}
                    transition-opacity
                  `}
                >
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              
              <input
                type="file"
                accept="image/*"
                ref={fotoInputRef}
                onChange={handleFotoChange}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={handleFotoClick}
                className={`
                  flex items-center gap-2 text-sm px-4 py-2 rounded-lg
                  ${darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                `}
                disabled={carregandoFoto}
              >
                <FileImage size={16} />
                {carregandoFoto ? 'Enviando...' : 'Alterar foto'}
              </button>
            </div>
            
            {/* Seção do nome */}
            <div className="flex-1 w-full">
              <div className="mb-6">
                <label 
                  htmlFor="nome"
                  className={`block mb-2 text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Nome
                </label>
                <input
                  type="text"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={`
                    w-full px-4 py-3 rounded-lg
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'}
                    border focus:ring-2 focus:outline-none
                    ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}
                  `}
                  placeholder="Seu nome"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label 
                  htmlFor="email"
                  className={`block mb-2 text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={usuario?.email || ''}
                  disabled
                  className={`
                    w-full px-4 py-3 rounded-lg
                    ${darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-500'}
                    border focus:outline-none cursor-not-allowed opacity-70
                  `}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  O email não pode ser alterado
                </p>
              </div>
              
              {mensagem.texto && (
                <div 
                  className={`mb-4 p-3 rounded-lg text-sm ${
                    mensagem.tipo === 'sucesso' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : mensagem.tipo === 'erro'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  <div className="flex items-center">
                    {mensagem.tipo === 'sucesso' && <CheckCircle2 size={16} className="mr-2" />}
                    {mensagem.texto}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvando || carregandoFoto}
              className={`
                flex items-center justify-center gap-2
                px-6 py-3 rounded-lg font-medium
                ${darkMode 
                  ? 'bg-[#3D9CD3] hover:bg-[#3689bd] text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}
                transition-colors
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuracoes; 