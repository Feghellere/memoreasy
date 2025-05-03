import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowLeft, Upload, Trash2, Wand2, Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface Questao {
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao?: string;
}

interface RespostaUsuario {
  questao: Questao;
  respostaUsuario: number;
}

export default function Quiz() {
  const { darkMode } = useDarkMode();
  const [material, setMaterial] = useState('');
  const [numeroQuestoes, setNumeroQuestoes] = useState(5);
  const [tipoQuestao, setTipoQuestao] = useState('multipla');
  const [dificuldade, setDificuldade] = useState('medio');
  const [iaAutomatica, setIaAutomatica] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostasUsuario, setRespostasUsuario] = useState<RespostaUsuario[]>([]);
  const [quizIniciado, setQuizIniciado] = useState(false);
  const [relatorioVisivel, setRelatorioVisivel] = useState(false);

  const handleGerarQuiz = async () => {
    if (!material.trim()) {
      setErro('Por favor, insira o material de estudo');
      return;
    }
    
    setCarregando(true);
    setErro(null);
    setQuestoes([]);
    setQuestaoAtual(0);
    setRespostasUsuario([]);
    setQuizIniciado(false);
    setRelatorioVisivel(false);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tema: material,
          numeroQuestoes,
          tipoQuestao,
          dificuldade,
          iaAutomatica
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar quiz');
      }
      
      const data = await response.json();
      setQuestoes(data.questoes);
      setQuizIniciado(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao gerar quiz');
    } finally {
      setCarregando(false);
    }
  };

  const handleResponder = (indice: number) => {
    const questaoAtualObj = questoes[questaoAtual];
    setRespostasUsuario([
      ...respostasUsuario,
      { questao: questaoAtualObj, respostaUsuario: indice }
    ]);

    if (questaoAtual < questoes.length - 1) {
      setTimeout(() => {
        setQuestaoAtual(questaoAtual + 1);
      }, 500);
    } else {
      setRelatorioVisivel(true);
    }
  };

  const calcularPontuacao = () => {
    return respostasUsuario.reduce((acc, resp) => 
      resp.respostaUsuario === resp.questao.respostaCorreta ? acc + 1 : acc, 0
    );
  };

  const reiniciarQuiz = () => {
    setQuestoes([]);
    setMaterial('');
    setQuizIniciado(false);
    setRelatorioVisivel(false);
    setQuestaoAtual(0);
    setRespostasUsuario([]);
    setErro(null);
  };

  return (
    <div className={`min-h-screen ${
      darkMode 
        ? 'bg-gradient-to-br from-[#0B1120] to-[#121e36]' 
        : 'bg-gradient-to-br from-gray-50 to-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-8">
          <Brain className={`h-8 w-8 ${darkMode ? 'text-[#3D9CD3]' : 'text-blue-600'} mr-3`} />
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Criador de Quiz
          </h1>
        </div>

        {!quizIniciado && !relatorioVisivel && (
          <>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              Crie perguntas de teste a partir do seu material de estudo e teste seus conhecimentos.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Material de Estudo */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg shadow-xl p-6 border h-full ${
                    darkMode 
                      ? 'bg-[#1e293b] border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    } flex items-center`}>
                      Material de estudo
                    </h2>
                    <div className="flex items-center">
                      <button
                        className={`${
                          darkMode 
                            ? 'text-[#3D9CD3] hover:text-[#2D8BA8]' 
                            : 'text-blue-600 hover:text-blue-700'
                        } p-2 rounded-lg transition-colors relative group`}
                      >
                        <Wand2 className="h-5 w-5" />
                        <span className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 ${
                          darkMode ? 'bg-gray-800' : 'bg-gray-900'
                        } text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`} 
                        style={{ width: 'max-content', boxShadow: '0 3px 10px rgba(0,0,0,0.2)' }}>
                          Gerar um tema aleatório
                        </span>
                      </button>
                      <button
                        className={`${
                          darkMode 
                            ? 'text-[#3D9CD3] hover:text-[#2D8BA8]' 
                            : 'text-blue-600 hover:text-blue-700'
                        } p-2 rounded-lg transition-colors relative group`}
                        onClick={() => setMaterial('')}
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 ${
                          darkMode ? 'bg-gray-800' : 'bg-gray-900'
                        } text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`} 
                        style={{ width: 'max-content', boxShadow: '0 3px 10px rgba(0,0,0,0.2)' }}>
                          Limpar material
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <textarea
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className={`w-full h-64 px-4 py-3 rounded-lg border ${
                        darkMode 
                          ? 'bg-[#131c31] border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      } focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50`}
                      placeholder="Insira seu material de estudo aqui..."
                    />
                  </div>

                  <div className="flex items-center justify-start">
                    <button className={`inline-flex items-center px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-[#131c31] text-gray-300 border-gray-700 hover:text-white' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900'
                      } transition-colors`}>
                      <Upload className="h-5 w-5 mr-2" />
                      Carregar arquivo
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Opções do Quiz */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`rounded-lg shadow-xl p-6 border h-full ${
                    darkMode 
                      ? 'bg-[#1e293b] border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center mb-6">
                    <Settings2 className={`h-5 w-5 ${
                      darkMode ? 'text-[#3D9CD3]' : 'text-blue-600'
                    } mr-2`} />
                    <h2 className={`text-lg font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Opções de Quiz
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className={`p-3 rounded-lg ${
                      darkMode ? 'bg-[#131c31]' : 'bg-gray-50'
                    }`}>
                      <label className="flex items-center">
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input
                            type="checkbox"
                            checked={iaAutomatica}
                            onChange={(e) => setIaAutomatica(e.target.checked)}
                            className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            style={{
                              top: '0px',
                              left: iaAutomatica ? '4px' : '0px',
                              transition: 'left 0.2s',
                              border: iaAutomatica 
                                ? darkMode ? '4px solid #3D9CD3' : '4px solid #2563eb' 
                                : darkMode ? '4px solid #475569' : '4px solid #d1d5db'
                            }}
                          />
                          <label 
                            className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                              iaAutomatica 
                                ? darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600' 
                                : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}
                          ></label>
                        </div>
                        <span className={`${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Deixe a IA determinar o número ideal de perguntas
                        </span>
                      </label>
                    </div>

                    {!iaAutomatica && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Número de perguntas (máx. 20)
                        </label>
                        <input
                          type="number"
                          value={numeroQuestoes}
                          onChange={(e) => setNumeroQuestoes(Number(e.target.value))}
                          min="1"
                          max="20"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-[#131c31] border-gray-700 text-white' 
                              : 'bg-white border-gray-200 text-gray-900'
                          } focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50`}
                        />
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Tipos de pergunta
                      </label>
                      <select
                        value={tipoQuestao}
                        onChange={(e) => setTipoQuestao(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-[#131c31] border-gray-700 text-white' 
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50`}
                      >
                        <option value="multipla">Múltipla escolha</option>
                        <option value="verdadeiro_falso">Verdadeiro ou Falso</option>
                        <option value="aleatorio">Aleatório</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Dificuldade
                      </label>
                      <select
                        value={dificuldade}
                        onChange={(e) => setDificuldade(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-[#131c31] border-gray-700 text-white' 
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50`}
                      >
                        <option value="facil">Fácil</option>
                        <option value="medio">Médio</option>
                        <option value="dificil">Difícil</option>
                      </select>
                    </div>

                    <button
                      onClick={handleGerarQuiz}
                      disabled={carregando}
                      className={`w-full flex items-center justify-center px-4 py-2 ${
                        darkMode 
                          ? 'bg-[#3D9CD3] hover:bg-[#2D8BA8]' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {carregando ? (
                        <>
                          <Brain className="h-5 w-5 mr-2 animate-spin" />
                          Gerando Quiz...
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5 mr-2" />
                          Gerar Quiz
                        </>
                      )}
                    </button>

                    {erro && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm mt-2"
                      >
                        {erro}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}

        {quizIniciado && !relatorioVisivel && questoes.length > 0 && (
          <motion.div
            key={questaoAtual}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className={`rounded-lg shadow-xl p-6 border ${
              darkMode 
                ? 'bg-[#1e293b] border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Questão {questaoAtual + 1} de {questoes.length}
                </span>
              </div>

              <div className="mb-8">
                <h3 className={`text-xl font-semibold mb-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {questoes[questaoAtual].pergunta}
                </h3>
                <div className="space-y-4">
                  {questoes[questaoAtual].alternativas.map((alternativa, index) => (
                    <button
                      key={index}
                      onClick={() => handleResponder(index)}
                      className={`w-full text-left p-4 rounded-lg transition-colors border ${
                        darkMode 
                          ? 'bg-[#131c31] hover:bg-[#1a2333] text-white border-gray-700' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        {alternativa}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {relatorioVisivel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className={`rounded-lg shadow-xl p-8 border ${
              darkMode 
                ? 'bg-[#1e293b] border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-2xl font-bold mb-6 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Relatório do Quiz
              </h2>

              <div className="mb-8">
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  darkMode 
                    ? 'bg-[#131c31] border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                } mb-4`}>
                  <span className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Pontuação Final
                  </span>
                  <span className={`text-2xl font-bold ${
                    darkMode ? 'text-[#3D9CD3]' : 'text-blue-600'
                  }`}>
                    {calcularPontuacao()} de {questoes.length} ({Math.round((calcularPontuacao() / questoes.length) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {respostasUsuario.map((resposta, index) => (
                  <div key={index} className={`p-6 rounded-lg border ${
                    darkMode 
                      ? 'bg-[#131c31] border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center mb-4">
                      <span className={`mr-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Questão {index + 1}</span>
                      {resposta.respostaUsuario === resposta.questao.respostaCorreta ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <h3 className={`text-lg font-medium mb-4 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {resposta.questao.pergunta}
                    </h3>

                    <div className="space-y-2 mb-4">
                      {resposta.questao.alternativas.map((alternativa, altIndex) => (
                        <div
                          key={altIndex}
                          className={`p-3 rounded-lg border ${
                            altIndex === resposta.questao.respostaCorreta
                              ? darkMode 
                                ? 'bg-green-600/20 text-green-400 border-green-600' 
                                : 'bg-green-50 text-green-700 border-green-200'
                              : altIndex === resposta.respostaUsuario && altIndex !== resposta.questao.respostaCorreta
                              ? darkMode
                                ? 'bg-red-600/20 text-red-400 border-red-600'
                                : 'bg-red-50 text-red-700 border-red-200'
                              : darkMode
                                ? 'bg-[#1e293b] text-gray-400 border-gray-700'
                                : 'bg-white text-gray-500 border-gray-200'
                          }`}
                        >
                          {alternativa}
                        </div>
                      ))}
                    </div>

                    {resposta.questao.explicacao && (
                      <div className={`mt-4 p-4 rounded-lg border ${
                        darkMode 
                          ? 'bg-[#1e293b] border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className={`font-medium ${
                            darkMode ? 'text-[#3D9CD3]' : 'text-blue-600'
                          }`}>Explicação:</span>{' '}
                          {resposta.questao.explicacao}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={reiniciarQuiz}
                  className={`inline-flex items-center px-6 py-3 ${
                    darkMode 
                      ? 'bg-[#3D9CD3] hover:bg-[#2D8BA8]' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors`}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Novo Quiz
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}