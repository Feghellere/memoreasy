import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { lousaService, Lousa } from '../lib/lousaService';

interface OutletContextType {
  darkMode: boolean;
}

const ListaLousas = () => {
  const { darkMode } = useOutletContext<OutletContextType>();
  const [lousas, setLousas] = useState<Lousa[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  // Carregar lousas ao montar o componente
  useEffect(() => {
    const carregarLousas = async () => {
      try {
        setCarregando(true);
        const data = await lousaService.listarLousas();
        setLousas(data);
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar lousas:', error);
        setErro('Não foi possível carregar as lousas. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarLousas();
  }, []);

  // Criar nova lousa
  const criarNovaLousa = () => {
    navigate('/app/nova-lousa');
  };

  // Excluir lousa
  const excluirLousa = async (id: string) => {
    if (!confirm('Tem certeza de que deseja excluir esta lousa?')) {
      return;
    }

    try {
      await lousaService.excluirLousa(id);
      setLousas(lousas.filter(lousa => lousa.id !== id));
    } catch (error) {
      console.error('Erro ao excluir lousa:', error);
      alert('Não foi possível excluir a lousa. Tente novamente.');
    }
  };

  // Formatar data
  const formatarData = (dataString?: string) => {
    if (!dataString) return '';
    
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Minhas Lousas</h1>
        
        <button
          onClick={criarNovaLousa}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${darkMode 
              ? 'bg-[#3D9CD3] hover:bg-[#3689bd] text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          <Plus className="h-5 w-5" />
          Criar Nova Lousa
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center py-12">
          <div 
            className={`
              h-8 w-8 animate-spin rounded-full border-4
              ${darkMode ? 'border-gray-600 border-t-blue-500' : 'border-gray-300 border-t-blue-600'}
            `}
          />
        </div>
      ) : erro ? (
        <div 
          className={`
            p-4 rounded-lg text-center
            ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'}
          `}
        >
          {erro}
        </div>
      ) : lousas.length === 0 ? (
        <div 
          className={`
            p-8 rounded-lg text-center 
            ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}
          `}
        >
          <p className="text-lg mb-4">Você ainda não criou nenhuma lousa</p>
          <button
            onClick={criarNovaLousa}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${darkMode 
                ? 'bg-[#3D9CD3] hover:bg-[#3689bd] text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            <Plus className="h-5 w-5" />
            Criar Primeira Lousa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lousas.map((lousa) => (
            <div 
              key={lousa.id}
              className={`
                overflow-hidden rounded-lg border
                ${darkMode 
                  ? 'bg-[#1e293b] border-gray-700' 
                  : 'bg-white border-gray-200 shadow-sm'
                }
              `}
            >
              <div className="relative aspect-video bg-gray-300 dark:bg-gray-700 overflow-hidden">
                {lousa.thumbnail ? (
                  <img 
                    src={lousa.thumbnail} 
                    alt={lousa.titulo} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span 
                      className={`
                        text-sm font-medium
                        ${darkMode ? 'text-gray-400' : 'text-gray-500'}
                      `}
                    >
                      Sem prévia
                    </span>
                  </div>
                )}

                <div 
                  className={`
                    absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100
                    bg-black/60 transition-opacity duration-200
                  `}
                >
                  <Link
                    to={`/app/lousa/${lousa.id}`}
                    className="
                      px-3 py-2 bg-white/20 text-white rounded-lg 
                      backdrop-blur-sm hover:bg-white/30 transition-colors
                    "
                  >
                    Abrir Lousa
                  </Link>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg truncate">
                  {lousa.titulo}
                </h3>
                
                {lousa.descricao && (
                  <p 
                    className={`
                      mt-1 text-sm truncate
                      ${darkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                  >
                    {lousa.descricao}
                  </p>
                )}
                
                <p 
                  className={`
                    mt-2 text-xs
                    ${darkMode ? 'text-gray-500' : 'text-gray-400'}
                  `}
                >
                  Atualizado em {formatarData(lousa.updated_at)}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <Link
                    to={`/app/lousa/${lousa.id}`}
                    className={`
                      flex items-center gap-1 text-sm font-medium
                      ${darkMode 
                        ? 'text-[#3D9CD3] hover:text-[#2D8BA8]' 
                        : 'text-blue-600 hover:text-blue-700'
                      }
                      transition-colors
                    `}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => excluirLousa(lousa.id!)}
                      className={`
                        p-1.5 rounded-lg transition-colors
                        ${darkMode 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700/50' 
                          : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                        }
                      `}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaLousas; 