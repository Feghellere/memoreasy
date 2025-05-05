import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowLeft, Upload, Trash2, Wand2, Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface Questao {
  id?: string;
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao?: string;
  tipoQuestao?: 'multipla' | 'verdadeiro_falso';
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

  // Função para remover respostas/questões duplicadas baseadas nas perguntas
  const removerDuplicatas = <T extends { questao: { pergunta: string } } | { pergunta: string }>(itens: T[]): T[] => {
    return itens.filter((item, index, self) => {
      const pergunta = 'questao' in item ? item.questao.pergunta : item.pergunta;
      return index === self.findIndex(i => {
        const outraPergunta = 'questao' in i ? i.questao.pergunta : i.pergunta;
        return pergunta.toLowerCase().trim() === outraPergunta.toLowerCase().trim();
      });
    });
  };

  // Função para calcular pontuação com tratamento de duplicatas
  const calcularPontuacao = () => {
    const respostasSemDuplicatas = removerDuplicatas(respostasUsuario);
    
    return respostasSemDuplicatas.reduce((acc, resp) => 
      resp.respostaUsuario === resp.questao.respostaCorreta ? acc + 1 : acc, 0
    );
  };

  // Função para obter o total de respostas sem duplicatas
  const obterTotalRespostasSemDuplicatas = () => {
    return removerDuplicatas(respostasUsuario).length;
  };

  const handleGerarQuiz = async () => {
    if (!material.trim()) {
      setErro('Por favor, insira o material de estudo');
      return;
    }
    
    // Validar número máximo de questões
    if (!iaAutomatica && numeroQuestoes > 20) {
      setErro('Número máximo de questões limitado em 20');
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
      console.log(`Gerando quiz com parâmetros: tipo=${tipoQuestao}, dificuldade=${dificuldade}, questões=${numeroQuestoes}, ia=${iaAutomatica}`);
      
      // Adicionar timeout para a requisição
      const controlador = new AbortController();
      const timeoutId = setTimeout(() => controlador.abort(), 120000); // 120 segundos timeout (aumentado de 60s)
      
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
          signal: controlador.signal
        });
        
        clearTimeout(timeoutId);
  
        // Analisar qualquer resposta de erro
        let responseText = '';
        try {
          responseText = await response.text();
          console.log('Resposta bruta da API:', responseText);
        } catch (textError) {
          console.error('Erro ao obter texto da resposta:', textError);
          throw new Error('Não foi possível ler a resposta da API');
        }
  
        let data;
        try {
          // Tentar fazer o parse normal
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Erro ao processar resposta JSON:', parseError);
          
          // Tentar recuperar um JSON válido
          try {
            // Verifica se temos a estrutura básica de um array de questões
            if (responseText.includes('"pergunta"') && responseText.includes('"alternativas"')) {
              // Tenta extrair um objeto JSON
              const match = responseText.match(/\{[\s\S]*\}/);
              if (match) {
                // Tenta o parse novamente
                data = JSON.parse(match[0]);
                console.log('JSON extraído manualmente:', data);
              }
            }
            
            // Se ainda não temos dados, tentar criar manualmente
            if (!data && responseText.includes('"pergunta"')) {
              // Tentar criar um objeto JSON manualmente
              const questaoMatch = responseText.match(/"pergunta"[\s\S]*?("explicacao"[\s\S]*?["})])/g);
              if (questaoMatch && questaoMatch.length > 0) {
                // Construir objeto JSON manualmente
                data = { 
                  questoes: questaoMatch.map(q => {
                    try {
                      return JSON.parse(`{${q}}`);
                    } catch (e) {
                      // Tentar reparar
                      const corrected = `{${q}}`.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                                             .replace(/,\s*}/g, '}')
                                             .replace(/,\s*]/g, ']');
                      return JSON.parse(corrected);
                    }
                  })
                };
                
                console.log('JSON construído manualmente:', data);
              }
            }
          } catch (recoveryError) {
            console.error('Falha na recuperação do JSON:', recoveryError);
          }
          
          // Se ainda não temos dados, lançar o erro
          if (!data) {
            throw new Error(`A API retornou uma resposta inválida. Tente novamente com um material diferente ou mais detalhado.`);
          }
        }
  
        if (!response.ok) {
          console.error('Resposta de erro:', data);
          
          // Extrair mensagem de erro mais específica
          let mensagemErro = 'Falha ao gerar quiz';
          if (data?.error) {
            mensagemErro = data.error;
          }
          
          throw new Error(mensagemErro);
        }
        
        console.log(`Quiz gerado com ${data.questoes?.length || 0} questões`);
        
        // Verificar e processar as questões recebidas
        if (!data.questoes || !Array.isArray(data.questoes) || data.questoes.length === 0) {
          throw new Error('Nenhuma questão foi gerada. Tente novamente ou use um material diferente.');
        }
        
        // Processar cada questão para garantir que tenha o tipo correto e todos os campos necessários
        const questoesProcessadas = data.questoes.map((questao: any, index: number) => {
          try {
            // Criamos um objeto base com valores padrão
            const questaoProcessada: Questao = {
              id: `temp-${index}`,
              pergunta: '',
              alternativas: [],
              respostaCorreta: 0,
              explicacao: '',
              tipoQuestao: 'multipla'
            };
            
            // Preenchemos com dados da API, com tratamento de erro robusto
            try {
              if (typeof questao.pergunta === 'string') {
                questaoProcessada.pergunta = questao.pergunta;
              } else {
                questaoProcessada.pergunta = `Questão ${index + 1}`;
                console.warn(`Questão ${index + 1} sem pergunta válida`);
              }
            } catch (error) {
              console.error(`Erro ao processar pergunta da questão ${index}:`, error);
              questaoProcessada.pergunta = `Questão ${index + 1}`;
            }
            
            // Processamos as alternativas com tratamento de erro
            try {
              if (Array.isArray(questao.alternativas) && questao.alternativas.length > 0) {
                questaoProcessada.alternativas = questao.alternativas.map((alt: any) => 
                  typeof alt === 'string' ? alt : String(alt)
                );
                
                // *** DETECÇÃO DE QUESTÕES VERDADEIRO/FALSO ***
                // Determinar se é uma questão de verdadeiro/falso baseado em múltiplos critérios
                if (questao.tipoQuestao === 'verdadeiro_falso') {
                  // 1. Caso mais simples: a questão já vem marcada como verdadeiro/falso
                  questaoProcessada.tipoQuestao = 'verdadeiro_falso';
                  questaoProcessada.alternativas = ['Verdadeiro', 'Falso'];
                } else {
                  // 2. Verificar por padrões nas alternativas que indicam verdadeiro/falso
                  const alternativasFormatadas = questaoProcessada.alternativas.map(alt => 
                    alt.toLowerCase().trim()
                  );
                  
                  // Verificamos diversas condições para detectar V/F:
                  const ehVerdadeiroFalso = 
                    // Se tem exatamente Verdadeiro e Falso como opções
                    (alternativasFormatadas.includes('verdadeiro') && alternativasFormatadas.includes('falso') && 
                     questaoProcessada.alternativas.length === 2) ||
                    // Se tem apenas V e F como opções
                    (alternativasFormatadas.includes('v') && alternativasFormatadas.includes('f') && 
                     questaoProcessada.alternativas.length === 2) ||
                    // Se a primeira alternativa é Verdadeiro/V e a segunda é Falso/F
                    (questaoProcessada.alternativas.length === 2 && 
                     (alternativasFormatadas[0] === 'verdadeiro' || alternativasFormatadas[0] === 'v') &&
                     (alternativasFormatadas[1] === 'falso' || alternativasFormatadas[1] === 'f'));
                  
                  if (ehVerdadeiroFalso) {
                    // Padronizar a questão como verdadeiro/falso
                    questaoProcessada.tipoQuestao = 'verdadeiro_falso';
                    questaoProcessada.alternativas = ['Verdadeiro', 'Falso'];
                    
                    // Ajustar a resposta correta para 0 (Verdadeiro) ou 1 (Falso)
                    // baseado na alternativa originalmente marcada como correta
                    if (typeof questao.respostaCorreta === 'number') {
                      const respostaOriginal = questao.alternativas[questao.respostaCorreta];
                      if (typeof respostaOriginal === 'string') {
                        const respOrigFormatada = respostaOriginal.toLowerCase().trim();
                        questaoProcessada.respostaCorreta = 
                          (respOrigFormatada === 'verdadeiro' || respOrigFormatada === 'v') ? 0 : 1;
                      }
                    }
                  }
                }
              } else if (typeof questao.resposta === 'string') {
                // 3. Caso especial: quando a IA retorna uma "resposta" no lugar de "alternativas"
                // Isso normalmente ocorre em questões verdadeiro/falso com formato não-padrão
                questaoProcessada.alternativas = ['Verdadeiro', 'Falso'];
                questaoProcessada.tipoQuestao = 'verdadeiro_falso';
                questaoProcessada.respostaCorreta = 
                  questao.resposta.toLowerCase().trim() === 'verdadeiro' ? 0 : 1;
              } else {
                // Fallback para casos não detectados
                questaoProcessada.alternativas = ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'];
                console.warn(`Questão ${index + 1} sem alternativas válidas`);
              }
            } catch (error) {
              console.error(`Erro ao processar alternativas da questão ${index}:`, error);
              questaoProcessada.alternativas = ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'];
            }
            
            // Se o tipo ainda não foi determinado, definir como múltipla escolha padrão
            try {
              if (!questaoProcessada.tipoQuestao) {
                questaoProcessada.tipoQuestao = 'multipla';
                
                // Garantir que temos pelo menos 4 alternativas para múltipla escolha
                while (questaoProcessada.alternativas.length < 4) {
                  questaoProcessada.alternativas.push(`Opção ${questaoProcessada.alternativas.length + 1}`);
                }
              }
            } catch (error) {
              console.error(`Erro ao processar tipo da questão ${index}:`, error);
              questaoProcessada.tipoQuestao = 'multipla';
            }
            
            // Processamos a resposta correta com tratamento de erro
            try {
              if (typeof questao.respostaCorreta === 'number' && 
                  questao.respostaCorreta >= 0 && 
                  questao.respostaCorreta < questaoProcessada.alternativas.length) {
                questaoProcessada.respostaCorreta = questao.respostaCorreta;
              } else {
                // Se a resposta correta é inválida, definir um valor padrão seguro
                if (questaoProcessada.tipoQuestao === 'verdadeiro_falso') {
                  // Para verdadeiro/falso, assume verdadeiro (0) como padrão
                  questaoProcessada.respostaCorreta = 0;
                } else {
                  // Para múltipla escolha, assume primeira opção (0) como padrão
                  questaoProcessada.respostaCorreta = 0;
                }
                console.warn(`Questão ${index + 1} sem resposta correta válida, definindo padrão para ${questaoProcessada.respostaCorreta}`);
              }
            } catch (error) {
              console.error(`Erro ao processar resposta correta da questão ${index}:`, error);
              questaoProcessada.respostaCorreta = 0;
            }
            
            // Processamos a explicação com tratamento de erro
            try {
              if (typeof questao.explicacao === 'string' && questao.explicacao.trim()) {
                questaoProcessada.explicacao = questao.explicacao;
              } else {
                questaoProcessada.explicacao = 'Não há explicação disponível para esta questão.';
              }
            } catch (error) {
              console.error(`Erro ao processar explicação da questão ${index}:`, error);
              questaoProcessada.explicacao = 'Erro ao processar explicação.';
            }
            
            return questaoProcessada;
          } catch (questaoError) {
            console.error(`Erro ao processar questão ${index}:`, questaoError);
            // Retornar uma questão padrão em caso de erro
            return {
              id: `temp-${index}`,
              pergunta: `Questão ${index + 1} (Recuperada)`,
              alternativas: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'],
              respostaCorreta: 0,
              explicacao: 'Questão recuperada após erro de processamento.',
              tipoQuestao: 'multipla'
            } as Questao;
          }
        });
        
        // Remover questões duplicadas - filtrar por texto da pergunta
        const questoesSemDuplicatas = questoesProcessadas.filter((questao: Questao, index: number, self: Questao[]) => {
          // Verificar se é a primeira ocorrência desta pergunta no array
          return index === self.findIndex(q => 
            q.pergunta.toLowerCase().trim() === questao.pergunta.toLowerCase().trim()
          );
        });
        
        // Filtrar questões vazias ou inválidas
        const questoesFiltradas = questoesSemDuplicatas.filter((q: Questao) => 
          q && q.pergunta && q.alternativas && q.alternativas.length > 0
        );
        
        // Limitar ao número de questões solicitado
        const questoesLimitadas = iaAutomatica 
          ? questoesFiltradas // Sem limitar número de questões no modo automático
          : questoesFiltradas.slice(0, numeroQuestoes);
        
        if (questoesLimitadas.length === 0) {
          throw new Error('Não foi possível criar questões válidas com o material fornecido. Tente novamente com um material mais detalhado.');
        }
        
        // Log para depuração
        console.log(`Número final de questões: ${questoesLimitadas.length}`);
        console.log('Questões processadas:', questoesLimitadas.map((q: Questao) => ({
          pergunta: q.pergunta.substring(0, 30) + '...',
          tipoQuestao: q.tipoQuestao,
          alternativas: q.alternativas
        })));
        
        setQuestoes(questoesLimitadas);
        setQuizIniciado(true);
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Por gentileza, tente gerar novamente');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Erro completo:', error);
      setErro('Por gentileza, tente gerar novamente');
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
      // Garantir que todas as questões foram respondidas
      if (respostasUsuario.length + 1 === questoes.length) {
        setRelatorioVisivel(true);
      } else {
        console.error(`Erro na contagem de respostas: ${respostasUsuario.length + 1} respostas vs ${questoes.length} questões`);
        // Forçar relatório mesmo assim
        setRelatorioVisivel(true);
      }
    }
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

  // Função para salvar quiz no banco de dados ao finalizar
  const salvarQuiz = async () => {
    if (questoes.length === 0 || respostasUsuario.length === 0) return;
    
    try {
      // Importação dinâmica da função saveQuiz
      const { saveQuiz, saveQuizResponses } = await import('../lib/quiz');
      
      // Salvar o quiz
      const titulo = `Quiz sobre ${material.slice(0, 50)}${material.length > 50 ? '...' : ''}`;
      const descricao = `Gerado em ${new Date().toLocaleDateString()} - ${tipoQuestao}, ${dificuldade}`;
      
      // Salvar o quiz no banco de dados
      const quizId = await saveQuiz(titulo, descricao, questoes);
      
      // Formatar as respostas do usuário
      const respostas = respostasUsuario.map((resposta, index) => ({
        questionId: questoes[index].id || `temp-${index}`,
        selectedAnswer: resposta.respostaUsuario,
        isCorrect: resposta.respostaUsuario === resposta.questao.respostaCorreta
      }));
      
      // Salvar as respostas
      await saveQuizResponses(quizId, respostas);
      
      console.log('Quiz salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar quiz:', error);
    }
  };

  // Efeito para salvar o quiz quando o relatório for exibido
  useEffect(() => {
    if (relatorioVisivel && questoes.length > 0) {
      salvarQuiz();
    }
  }, [relatorioVisivel]);

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
                          onChange={(e) => {
                            const valor = parseInt(e.target.value);
                            if (isNaN(valor)) {
                              setNumeroQuestoes(1);
                            } else if (valor > 20) {
                              setNumeroQuestoes(20);
                            } else if (valor < 1) {
                              setNumeroQuestoes(1);
                            } else {
                              setNumeroQuestoes(valor);
                            }
                          }}
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
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  darkMode 
                    ? questoes[questaoAtual].tipoQuestao === 'verdadeiro_falso'
                      ? 'bg-indigo-700 text-indigo-200' 
                      : 'bg-gray-700 text-gray-300'
                    : questoes[questaoAtual].tipoQuestao === 'verdadeiro_falso'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {questoes[questaoAtual].tipoQuestao === 'verdadeiro_falso' 
                    ? 'Verdadeiro ou Falso' 
                    : 'Múltipla Escolha'}
                </span>
              </div>

              <div className="mb-8">
                <h3 className={`text-xl font-semibold mb-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {questoes[questaoAtual].pergunta}
                </h3>

                <div className={`space-y-4 ${
                  questoes[questaoAtual].tipoQuestao === 'verdadeiro_falso' ? 'grid grid-cols-2 gap-4 space-y-0' : ''
                }`}>
                  {questoes[questaoAtual].alternativas.map((alternativa, index) => (
                    <button
                      key={index}
                      onClick={() => handleResponder(index)}
                      className={`w-full text-left p-4 rounded-lg transition-colors border ${
                        darkMode 
                          ? 'bg-[#131c31] hover:bg-[#1a2333] text-white border-gray-700' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200'
                      } ${
                        questoes[questaoAtual].tipoQuestao === 'verdadeiro_falso'
                          ? 'flex items-center justify-center font-medium text-center'
                          : ''
                      }`}
                    >
                      <div className={`flex items-center ${
                        questoes[questaoAtual].tipoQuestao === 'verdadeiro_falso' ? 'justify-center' : ''
                      }`}>
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
                    {(() => {
                      const pontuacao = calcularPontuacao();
                      const total = obterTotalRespostasSemDuplicatas();
                      const porcentagem = total > 0 ? Math.round((pontuacao / total) * 100) : 0;
                      
                      return `${pontuacao} de ${total} (${porcentagem}%)`;
                    })()}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Filtrar respostas duplicadas antes de exibir */}
                {removerDuplicatas(respostasUsuario).map((resposta, index) => (
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

                    {/* Indicador do tipo de questão */}
                    <div className={`mb-3 text-xs font-semibold inline-block px-2 py-1 rounded-full ${
                      darkMode 
                        ? resposta.questao.tipoQuestao === 'verdadeiro_falso'
                          ? 'bg-indigo-700 text-indigo-200' 
                          : 'bg-gray-700 text-gray-300'
                        : resposta.questao.tipoQuestao === 'verdadeiro_falso'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {resposta.questao.tipoQuestao === 'verdadeiro_falso' 
                        ? 'Verdadeiro ou Falso' 
                        : 'Múltipla Escolha'}
                    </div>

                    <div className={`space-y-2 mb-4 ${
                      resposta.questao.tipoQuestao === 'verdadeiro_falso' ? 'grid grid-cols-2 gap-4 space-y-0' : ''
                    }`}>
                      {resposta.questao.alternativas.map((alternativa, altIndex) => (
                        <div
                          key={altIndex}
                          className={`p-3 rounded-lg border ${
                            resposta.questao.tipoQuestao === 'verdadeiro_falso' ? 'text-center font-medium' : ''
                          } ${
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