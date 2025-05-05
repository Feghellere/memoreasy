import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuizConfig {
  tema: string;
  numeroQuestoes: number;
  tipoQuestao: 'multipla' | 'verdadeiro_falso' | 'aleatorio';
  dificuldade: 'facil' | 'medio' | 'dificil';
  iaAutomatica: boolean;
}

interface QuizQuestion {
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao: string;
  tipoQuestao?: 'multipla' | 'verdadeiro_falso';
}

// Função para registrar métricas de desempenho
function registrarMetricas(
  inicio: number, 
  fim: number, 
  config: QuizConfig, 
  questoesGeradas: number,
  modeloUsado: string,
  status: 'sucesso' | 'erro',
  detalhes?: string
) {
  const tempoTotal = Math.round((fim - inicio) / 1000); // tempo em segundos
  
  console.log(JSON.stringify({
    tipo: 'metricas_quiz',
    timestamp: new Date().toISOString(),
    tempo_total_segundos: tempoTotal,
    config: {
      tipo_questao: config.tipoQuestao,
      dificuldade: config.dificuldade,
      numero_questoes: config.numeroQuestoes,
      ia_automatica: config.iaAutomatica
    },
    tamanho_material: config.tema.length,
    questoes_geradas: questoesGeradas,
    modelo_usado: modeloUsado,
    status,
    detalhes
  }));
}

// Função para criar um controle de timeout
function createTimeoutController(ms: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  return {
    signal: controller.signal,
    clearTimeout: () => clearTimeout(timeoutId)
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Registrar o tempo de início
  const tempoInicio = performance.now();
  let modeloUsado = 'nenhum';
  let questoesGeradas = 0;
  
  // Criar um controlador de timeout para toda a função (limite Supabase é de 10 segundos)
  const functionTimeout = createTimeoutController(8000); // 8 segundos para ter margem
  
  try {
    const config: QuizConfig = await req.json();

    if (!config.tema || typeof config.tema !== "string") {
      throw new Error("Tema inválido");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
      throw new Error("Chaves de API não configuradas");
    }

    const questionTypeInstruction = getQuestionTypeInstruction(config.tipoQuestao);
    const difficultyInstruction = getDifficultyInstruction(config.dificuldade);
    
    const systemPrompt = `Você é um assistente especializado em criar quizzes educacionais.
SIGA ESTRITAMENTE estas instruções ao gerar o quiz:

1. Tipo de Questão: ${questionTypeInstruction}
2. Dificuldade: ${difficultyInstruction}
3. Número de Questões: ${config.iaAutomatica ? 'Determine o número apropriado baseado no conteúdo' : config.numeroQuestoes}

REGRAS OBRIGATÓRIAS:
- Cada questão DEVE ter uma explicação detalhada
- Para múltipla escolha: SEMPRE 4 alternativas
- Para verdadeiro/falso: Use EXATAMENTE "Verdadeiro" e "Falso" como alternativas
- No modo aleatório: Mantenha proporção igual entre tipos
- Respeite ESTRITAMENTE o nível de dificuldade solicitado
- Inclua SEMPRE o campo "tipoQuestao" com valor "multipla" ou "verdadeiro_falso"

O formato de resposta DEVE ser um objeto JSON com a seguinte estrutura:
{
  "questoes": [
    {
      "pergunta": "Texto da pergunta",
      "alternativas": ["A", "B", "C", "D"],
      "respostaCorreta": 0,
      "explicacao": "Explicação detalhada",
      "tipoQuestao": "multipla"
    }
  ]
}`;

    const userPrompt = `Crie um quiz sobre: "${config.tema}"

PARÂMETROS OBRIGATÓRIOS:
- Tipo: ${config.tipoQuestao}
- Dificuldade: ${config.dificuldade}
- Número de questões: ${config.iaAutomatica ? 'Determine o ideal' : config.numeroQuestoes}

Retorne APENAS o JSON, sem texto adicional.`;

    // Primeiro tenta com Gemini
    if (GEMINI_API_KEY) {
      try {
        console.log("Iniciando chamada para Gemini API...");
        
        const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
        console.log("URL Gemini:", geminiUrl);

        const geminiBody = {
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        };

        console.log("Corpo da requisição Gemini:", JSON.stringify(geminiBody, null, 2));

        // Adicionar timeout específico para a chamada Gemini (mais curto que o da função)
        const geminiTimeout = createTimeoutController(7000); // 7 segundos
        
        try {
          const response = await fetch(
            `${geminiUrl}?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(geminiBody),
              signal: geminiTimeout.signal
            }
          );
          
          // Limpar timeout da chamada Gemini
          geminiTimeout.clearTimeout();
  
          console.log("Status Gemini:", response.status);
          console.log("Headers Gemini:", Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Erro Gemini (texto completo):", errorText);
            throw new Error(`Erro na API do Gemini: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log("Resposta Gemini:", JSON.stringify(data, null, 2));

          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const finishReason = data.candidates?.[0]?.finishReason;
          
          if (!rawText) {
            console.error("Resposta Gemini sem texto:", data);
            throw new Error("Resposta inválida do Gemini");
          }
          
          // Verificar se a resposta foi truncada por limite de tokens
          const truncatedByMaxTokens = finishReason === "MAX_TOKENS";
          if (truncatedByMaxTokens) {
            console.log("Resposta Gemini truncada por limite de tokens. Tentando recuperação especial...");
          }

          try {
            // Se a resposta não foi truncada, tentar processar normalmente
            if (!truncatedByMaxTokens) {
              const quiz = parseAndValidateQuiz(rawText, config);
              
              // Atualizar o número de questões geradas
              questoesGeradas = quiz.questoes?.length || 0;
              
              // Limpar o timeout da função principal antes de retornar
              functionTimeout.clearTimeout();
              
              // Registrar métricas antes de retornar
              registrarMetricas(
                tempoInicio, 
                performance.now(), 
                config, 
                questoesGeradas,
                'gemini-1.5-pro',
                'sucesso'
              );
              
              return new Response(JSON.stringify(quiz), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              });
            }
            
            // Para respostas truncadas, aplicar estratégia específica
            console.log("Aplicando tratamento de recuperação para resposta truncada...");
            
            // Extrair JSON incompleto do texto
            let jsonText = "";
            
            if (rawText.includes("```json")) {
              // Remover o início do bloco de código markdown
              jsonText = rawText.substring(rawText.indexOf("```json") + 7);
            } else if (rawText.includes("{")) {
              // Pegar a partir do primeiro {
              jsonText = rawText.substring(rawText.indexOf("{"));
            } else {
              throw new Error("Não foi possível identificar JSON na resposta truncada");
            }
            
            // Garantir que o JSON termina corretamente
            // 1. Identificar a última questão completa
            const questoesMatch = jsonText.match(/"questoes"\s*:\s*\[([\s\S]*)/);
            if (!questoesMatch) {
              throw new Error("Formato de resposta inválido, não encontrou array de questões");
            }
            
            // Extrair o conteúdo do array de questões
            const questoesContent = questoesMatch[1];
            
            // Encontrar todas as questões completas
            const questoesCompletas = [];
            let currentPos = 0;
            const questaoRegex = /\s*\{\s*"pergunta"[\s\S]*?"explicacao"\s*:\s*"[^"]*"\s*\}/g;
            
            let match;
            while ((match = questaoRegex.exec(questoesContent)) !== null) {
              if (match.index >= currentPos) {
                questoesCompletas.push(match[0]);
                currentPos = match.index + match[0].length;
              }
            }
            
            // Reconstruir o JSON com as questões completas
            if (questoesCompletas.length > 0) {
              const jsonReconstruido = `{"questoes": [${questoesCompletas.join(',')}]}`;
              
              // Tentar analisar o JSON reconstruído
              const quiz = parseAndValidateQuiz(jsonReconstruido, config);
              
              console.log(`Recuperação bem-sucedida! Extraídas ${questoesCompletas.length} questões completas.`);
              
              // Atualizar o número de questões geradas
              questoesGeradas = quiz.questoes?.length || 0;
              
              // Limpar timeout da função principal
              functionTimeout.clearTimeout();
              
              // Registrar métricas antes de retornar
              registrarMetricas(
                tempoInicio, 
                performance.now(), 
                config, 
                questoesGeradas,
                'gemini-1.5-pro',
                'sucesso',
                `Recuperadas ${questoesCompletas.length} questões completas`
              );
              
              return new Response(JSON.stringify(quiz), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              });
            } else {
              // Se não conseguir extrair nenhuma questão completa
              throw new Error("Não foi possível extrair questões completas");
            }
          } catch (parsingError) {
            console.error("Erro ao processar resposta do Gemini:", parsingError);
            
            // Verificar se parece uma resposta truncada
            if (rawText.includes("```json") && !rawText.includes("```", rawText.indexOf("```json") + 6)) {
              console.log("Resposta JSON truncada detectada, tentando recuperar...");
              
              // Tentar recuperar o JSON mesmo truncado
              try {
                // Extrair só o que está dentro do bloco de código, removendo o cabeçalho ```json
                const jsonContent = rawText.substring(rawText.indexOf("```json") + 7);
                
                // Tentar reparar o JSON truncado
                let cleanedJson = corrigirJsonMalformado(jsonContent);
                
                // Verificar se há objeto "questoes" no JSON
                if (!cleanedJson.includes('"questoes"')) {
                  cleanedJson = `{"questoes": ${cleanedJson.startsWith('[') ? cleanedJson : `[${cleanedJson}`}`;
                  
                  // Garantir que fechamos o array e o objeto
                  if (!cleanedJson.endsWith(']')) cleanedJson += ']';
                  if (!cleanedJson.endsWith(']}')) cleanedJson += '}';
                }
                
                // Tentar analisar o JSON reparado
                const quiz = parseAndValidateQuiz(cleanedJson, config);
                
                // Atualizar o número de questões geradas
                questoesGeradas = quiz.questoes?.length || 0;
                
                // Limpar timeout da função principal
                functionTimeout.clearTimeout();
                
                // Registrar métricas antes de retornar
                registrarMetricas(
                  tempoInicio, 
                  performance.now(), 
                  config, 
                  questoesGeradas,
                  'gemini-1.5-pro',
                  'sucesso',
                  `Recuperadas ${questoesCompletas.length} questões completas`
                );
                
                return new Response(JSON.stringify(quiz), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
              } catch (recoveryError) {
                console.error("Falha na recuperação da resposta truncada:", recoveryError);
                // Se falhar na recuperação, continuar para o fallback
                if (!OPENAI_API_KEY) throw recoveryError;
              }
            }
            
            // Se não for uma resposta truncada ou falhar na recuperação, continuar para o fallback
            if (!OPENAI_API_KEY) throw parsingError;
            console.log("Fallback para OpenAI após falha no Gemini...");
          }
        } catch (fetchError) {
          // Limpar timeout da chamada Gemini
          geminiTimeout.clearTimeout();
          
          if (fetchError.name === 'AbortError') {
            console.error("Tempo limite excedido na chamada ao Gemini");
            
            if (!OPENAI_API_KEY) {
              throw new Error("Tempo limite excedido, tente novamente com um material menor");
            }
            
            console.log("Fallback para OpenAI após timeout Gemini...");
          } else {
            throw fetchError;
          }
        }
      } catch (geminiError) {
        console.error("Erro detalhado no Gemini:", geminiError);
        if (!OPENAI_API_KEY) throw geminiError;
        console.log("Fallback para OpenAI...");
      }
    }

    // Fallback para OpenAI
    if (OPENAI_API_KEY) {
      console.log("Iniciando chamada para OpenAI...");
      
      // Adicionar timeout específico para a chamada OpenAI
      const openaiTimeout = createTimeoutController(5000); // 5 segundos (menor que Gemini)
      
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7
          }),
          signal: openaiTimeout.signal
        });

        // Limpar timeout da chamada OpenAI
        openaiTimeout.clearTimeout();
        
        console.log("Status OpenAI:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro OpenAI (texto completo):", errorText);
          throw new Error(`Erro na API da OpenAI: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Resposta OpenAI:", JSON.stringify(data, null, 2));

        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          console.error("Resposta OpenAI sem conteúdo:", data);
          throw new Error("Resposta inválida da OpenAI");
        }

        const quiz = parseAndValidateQuiz(content, config);

        // Atualizar o número de questões geradas
        questoesGeradas = quiz.questoes?.length || 0;

        // Limpar timeout da função principal antes de retornar
        functionTimeout.clearTimeout();
        
        // Registrar métricas antes de retornar
        registrarMetricas(
          tempoInicio, 
          performance.now(), 
          config, 
          questoesGeradas,
          'gpt-4o-mini',
          'sucesso'
        );
        
        return new Response(JSON.stringify(quiz), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (openaiError) {
        // Limpar timeout da chamada OpenAI
        openaiTimeout.clearTimeout();
        
        if (openaiError.name === 'AbortError') {
          console.error("Tempo limite excedido na chamada à OpenAI");
          throw new Error("Tempo limite excedido, tente novamente com um material menor");
        }
        
        throw openaiError;
      }
    }

    throw new Error("Nenhum serviço de IA disponível");
  } catch (error) {
    // Limpar timeout da função principal antes de retornar erro
    functionTimeout.clearTimeout();
    
    // Registrar métricas de erro
    registrarMetricas(
      tempoInicio, 
      performance.now(), 
      (error.config || {}) as QuizConfig, 
      questoesGeradas,
      modeloUsado,
      'erro',
      error.message
    );
    
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao gerar quiz",
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

function getQuestionTypeInstruction(tipo: string): string {
  switch (tipo) {
    case 'multipla':
      return 'APENAS questões de múltipla escolha com EXATAMENTE 4 alternativas';
    case 'verdadeiro_falso':
      return 'APENAS questões de verdadeiro ou falso';
    case 'aleatorio':
      return 'Mix equilibrado de múltipla escolha e verdadeiro/falso. Máximo de 10 questões de cada tipo.';
    default:
      return 'APENAS questões de múltipla escolha';
  }
}

function getDifficultyInstruction(dificuldade: string): string {
  switch (dificuldade) {
    case 'facil':
      return 'FÁCIL - Questões básicas, conceitos fundamentais, vocabulário simples';
    case 'medio':
      return 'MÉDIO - Questões moderadas, análise básica, conexões simples entre conceitos';
    case 'dificil':
      return 'DIFÍCIL - Questões complexas, análise profunda, conexões entre múltiplos conceitos';
    default:
      return 'MÉDIO';
  }
}

function parseAndValidateQuiz(rawText: string, config: QuizConfig): { questoes: QuizQuestion[] } {
  try {
    console.log("Texto bruto para parse:", rawText);
    
    // Tenta limpar o JSON antes de fazer o parse
    let jsonText = rawText;
    
    // Extrai o JSON da resposta
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      jsonText = match[0];
    } else {
      console.error("Nenhum JSON encontrado no texto:", rawText);
      throw new Error("Nenhum JSON encontrado na resposta");
    }
    
    // Tentativa de corrigir possíveis erros comuns de JSON antes do parse
    jsonText = corrigirJsonMalformado(jsonText);
    
    let json;
    try {
      json = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Erro ao fazer parse JSON inicial:", parseError);
      console.log("Tentando correções adicionais...");
      
      // Tenta recuperar o JSON de forma mais agressiva
      jsonText = recuperarJson(jsonText);
      
      try {
        json = JSON.parse(jsonText);
        console.log("Parse JSON bem-sucedido após correção");
      } catch (finalError) {
        console.error("Falha final ao fazer parse JSON:", finalError);
        throw new Error(`Falha ao processar resposta da IA: ${finalError.message}`);
      }
    }
    
    console.log("JSON parseado:", JSON.stringify(json, null, 2));

    if (!json?.questoes || !Array.isArray(json.questoes)) {
      console.error("Estrutura JSON inválida:", json);
      throw new Error("Formato de resposta inválido");
    }

    // Valida cada questão
    json.questoes = json.questoes.map((questao: any, index: number) => {
      console.log(`Validando questão ${index + 1}:`, questao);

      if (!questao.pergunta || typeof questao.pergunta !== 'string') {
        throw new Error(`Questão ${index + 1}: Pergunta inválida`);
      }

      // Correção para estrutura de questões verdadeiro/falso
      // Às vezes a IA retorna "resposta" em vez de "alternativas" e "respostaCorreta"
      if (!Array.isArray(questao.alternativas)) {
        // Verificar se temos um formato de verdadeiro/falso com campo "resposta"
        if (questao.resposta && typeof questao.resposta === 'string') {
          console.log(`Questão ${index + 1}: Detectado formato alternativo de verdadeiro/falso`);
          const resposta = questao.resposta.toLowerCase().trim();
          
          // Criar as alternativas e a resposta correta
          questao.alternativas = ["Verdadeiro", "Falso"];
          questao.respostaCorreta = (resposta === "verdadeiro" || resposta === "v") ? 0 : 1;
          questao.tipoQuestao = "verdadeiro_falso";
          
          console.log(`Questão ${index + 1}: Convertido para formato padrão com alternativas:`, 
            questao.alternativas, "e respostaCorreta:", questao.respostaCorreta);
        } else {
          throw new Error(`Questão ${index + 1}: Alternativas inválidas`);
        }
      }

      // Determina o tipo real da questão (útil para modo aleatório)
      let tipoRealQuestao = config.tipoQuestao;
      
      // Se já temos um tipo definido na questão, temos preferência por ele
      if (questao.tipoQuestao === 'verdadeiro_falso' || questao.tipoQuestao === 'multipla') {
        tipoRealQuestao = questao.tipoQuestao;
      }
      // No modo aleatório, detecta o tipo específico da questão se não estiver especificado
      else if (config.tipoQuestao === 'aleatorio' || !questao.tipoQuestao) {
        // Detectar questões verdadeiro/falso baseado nas alternativas
        const textoAlternativas = questao.alternativas.map((alt: string) => 
          typeof alt === 'string' ? alt.toLowerCase().trim() : '');
        
        const temVerdadeiroFalso = (
          (textoAlternativas.includes('verdadeiro') && textoAlternativas.includes('falso')) ||
          (textoAlternativas.length === 2 && 
           ((textoAlternativas.includes('v') && textoAlternativas.includes('f')) ||
            (textoAlternativas[0] === 'verdadeiro' && textoAlternativas[1] === 'falso')))
        );
        
        tipoRealQuestao = temVerdadeiroFalso ? 'verdadeiro_falso' : 'multipla';
      }

      // Validação específica por tipo de questão
      if (tipoRealQuestao === 'multipla' && questao.alternativas.length !== 4) {
        console.warn(`Questão ${index + 1}: Número incorreto de alternativas para múltipla escolha. Ajustando...`);
        
        // Tentar corrigir alternativas insuficientes
        if (questao.alternativas.length < 4) {
          // Adicionar alternativas genéricas se faltarem
          while (questao.alternativas.length < 4) {
            questao.alternativas.push(`Alternativa ${questao.alternativas.length + 1}`);
          }
        } else if (questao.alternativas.length > 4) {
          // Limitar a 4 alternativas
          questao.alternativas = questao.alternativas.slice(0, 4);
          
          // Garantir que a resposta correta esteja no intervalo válido
          if (questao.respostaCorreta >= 4) {
            questao.respostaCorreta = 0;
          }
        }
      } else if (tipoRealQuestao === 'verdadeiro_falso') {
        // Normalizar para ter exatamente 2 alternativas: "Verdadeiro" e "Falso"
        const temVerdadeiro = questao.alternativas.some(
          (alt: string) => typeof alt === 'string' && 
            (alt.toLowerCase().trim() === 'verdadeiro' || alt.toLowerCase().trim() === 'v')
        );
        const temFalso = questao.alternativas.some(
          (alt: string) => typeof alt === 'string' && 
            (alt.toLowerCase().trim() === 'falso' || alt.toLowerCase().trim() === 'f')
        );
        
        if (!temVerdadeiro || !temFalso || questao.alternativas.length !== 2) {
          console.warn(`Questão ${index + 1}: Corrigindo alternativas para verdadeiro/falso`);
          questao.alternativas = ["Verdadeiro", "Falso"];
          
          // Se temos uma resposta, normalizar baseado nela
          if (typeof questao.resposta === 'string') {
            const resposta = questao.resposta.toLowerCase().trim();
            questao.respostaCorreta = (resposta === "verdadeiro" || resposta === "v") ? 0 : 1;
          } 
          // Caso contrário, ajustar a resposta correta para estar no intervalo válido
          else if (questao.respostaCorreta >= 2) {
            questao.respostaCorreta = 0;
          }
        }
      }

      // Verificar se respostaCorreta existe, e se não existir, criar baseado nos dados disponíveis
      if (typeof questao.respostaCorreta !== 'number') {
        // Se tivermos o campo resposta e for verdadeiro/falso, usar para determinar a resposta correta
        if (typeof questao.resposta === 'string' && tipoRealQuestao === 'verdadeiro_falso') {
          const resposta = questao.resposta.toLowerCase().trim();
          questao.respostaCorreta = (resposta === "verdadeiro" || resposta === "v") ? 0 : 1;
        } else {
          // Caso contrário, usar um valor padrão
          console.warn(`Questão ${index + 1}: Definindo resposta correta padrão como 0`);
          questao.respostaCorreta = 0;
        }
      }
      
      // Validação final da resposta correta
      if (questao.respostaCorreta < 0 || questao.respostaCorreta >= questao.alternativas.length) {
        console.warn(`Questão ${index + 1}: Resposta correta inválida (${questao.respostaCorreta}). Definindo como 0.`);
        questao.respostaCorreta = 0;
      }

      if (!questao.explicacao || typeof questao.explicacao !== 'string') {
        console.warn(`Questão ${index + 1}: Explicação inválida. Adicionando explicação padrão.`);
        questao.explicacao = "Não foi fornecida uma explicação para esta questão.";
      }

      // Adicionar metadados para ajudar o frontend e limpar campos que não fazem parte da estrutura esperada
      const questaoNormalizada = {
        pergunta: questao.pergunta,
        alternativas: questao.alternativas,
        respostaCorreta: questao.respostaCorreta,
        explicacao: questao.explicacao,
        tipoQuestao: tipoRealQuestao // Adicionar tipo real da questão para o frontend
      };

      return questaoNormalizada;
    });

    // Valida número de questões se não for automático
    if (!config.iaAutomatica && json.questoes.length !== config.numeroQuestoes) {
      console.warn(
        `Número incorreto de questões: esperado ${config.numeroQuestoes}, recebido ${json.questoes.length}. Ajustando...`
      );

      if (json.questoes.length < config.numeroQuestoes) {
        // Se temos menos questões que o solicitado, duplicamos algumas para chegar ao número pedido
        const questoesOriginais = [...json.questoes];
        while (json.questoes.length < config.numeroQuestoes && questoesOriginais.length > 0) {
          // Pegar uma questão do conjunto original e modificá-la levemente
          const questaoBase = {...questoesOriginais[json.questoes.length % questoesOriginais.length]};
          questaoBase.pergunta = `${questaoBase.pergunta} (variação)`;
          json.questoes.push(questaoBase);
        }
      } else if (json.questoes.length > config.numeroQuestoes) {
        // Se temos mais questões que o solicitado, mantemos apenas o número pedido
        json.questoes = json.questoes.slice(0, config.numeroQuestoes);
      }
    }

    console.log(`Quiz validado com ${json.questoes.length} questões`);
    return json;
  } catch (error) {
    console.error("Erro na validação:", error);
    throw new Error(`Erro ao validar quiz: ${error.message}`);
  }
}

// Função para corrigir problemas comuns em JSON malformado
function corrigirJsonMalformado(jsonText: string): string {
  let texto = jsonText;
  
  console.log("Iniciando correção de JSON malformado. Tamanho: " + texto.length);
  
  // Remover caracteres de controle e espaços no início e fim
  texto = texto.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // Remover qualquer parte antes do primeiro "{" e depois do último "}"
  const primeiraChave = texto.indexOf('{');
  const ultimaChave = texto.lastIndexOf('}');
  
  if (primeiraChave !== -1 && ultimaChave !== -1 && ultimaChave > primeiraChave) {
    texto = texto.substring(primeiraChave, ultimaChave + 1);
  }
  
  // Corrigir aspas
  texto = texto.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
  
  // Corrigir vírgulas duplicadas
  texto = texto.replace(/,\s*,/g, ',');
  
  // Remover vírgulas antes de fechar objetos ou arrays
  texto = texto.replace(/,\s*\}/g, '}');
  texto = texto.replace(/,\s*\]/g, ']');
  
  // Adicionar aspas em valores que deveriam ter aspas
  texto = texto.replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,}])/g, ':"$1"$2');
  
  // Corrigir aspas aninhadas usando simples para internas
  texto = texto.replace(/"([^"]*)""/g, '"$1\'');
  texto = texto.replace(/""/g, '"');
  
  // Verificar e corrigir arrays e objetos desbalanceados
  let balanceChaves = 0;
  let balanceColchetes = 0;
  
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] === '{') balanceChaves++;
    if (texto[i] === '}') balanceChaves--;
    if (texto[i] === '[') balanceColchetes++;
    if (texto[i] === ']') balanceColchetes--;
  }
  
  // Adicionar chaves/colchetes faltantes ou remover excedentes
  while (balanceChaves > 0) {
    texto += '}';
    balanceChaves--;
  }
  while (balanceColchetes > 0) {
    texto += ']';
    balanceColchetes--;
  }
  while (balanceChaves < 0 && texto.endsWith('}')) {
    texto = texto.slice(0, -1);
    balanceChaves++;
  }
  while (balanceColchetes < 0 && texto.endsWith(']')) {
    texto = texto.slice(0, -1);
    balanceColchetes++;
  }
  
  console.log("JSON corrigido. Novo tamanho: " + texto.length);
  
  return texto;
}

// Função para tentar recuperar JSON de forma mais agressiva
function recuperarJson(texto: string): string {
  console.log("Tentando recuperar JSON de texto potencialmente malformado ou truncado");
  
  // Verificar se temos a estrutura básica de um código JSON em markdown
  if (texto.includes("```json") || texto.includes("```")) {
    // Tentar extrair o JSON de um formato de código de markdown
    const codeBlockMatch = texto.match(/```(?:json)?([\s\S]*?)```/);
    if (codeBlockMatch) {
      texto = codeBlockMatch[1].trim();
      console.log("Extraído conteúdo JSON de bloco de código markdown");
    } else if (texto.includes("```json") || texto.includes("```")) {
      // Se houver abertura do bloco mas não fechamento (truncado)
      const startIndex = texto.indexOf("```json") !== -1 ? 
                         texto.indexOf("```json") + 7 : 
                         texto.indexOf("```") + 3;
      texto = texto.substring(startIndex).trim();
      console.log("Extraído conteúdo de bloco de código truncado");
    }
  }
  
  // Verificar se temos objeto com questões ou apenas array de questões
  if (!texto.includes('"questoes"') && texto.includes('"pergunta"')) {
    console.log("JSON contém perguntas mas sem wrapper 'questoes', adicionando estrutura");
    
    // Se o texto começa com [ e termina com ], apenas adicione o wrapper questoes
    if (texto.trim().startsWith('[') && texto.trim().endsWith(']')) {
      texto = `{"questoes": ${texto}}`;
    } 
    // Se é um array truncado (começa com [ mas não termina com ])
    else if (texto.trim().startsWith('[') && !texto.trim().endsWith(']')) {
      texto = `{"questoes": ${texto}]}`;
    }
    // Se é um objeto único (uma questão), coloque em um array
    else if (!texto.trim().startsWith('[')) {
      texto = `{"questoes": [${texto}]}`;
    }
  }
  
  // Tentar extrair o objeto principal se não foi feito antes
  if (!texto.startsWith('{')) {
    const objMatch = texto.match(/\{[\s\S]*\}/);
    if (objMatch) {
      texto = objMatch[0];
      console.log("Extraído objeto JSON principal do texto");
    }
  }
  
  try {
    // Teste se é válido
    JSON.parse(texto);
    return texto;
  } catch (e) {
    console.log("Ainda com erro de parse, aplicando correções finais...");
    
    // Correções finais
    texto = corrigirJsonMalformado(texto);
    
    // Verificar se temos questões parciais
    if (texto.includes('"pergunta"') && !texto.includes('"questoes"')) {
      // Se for um array completo
      if (texto.trim().startsWith('[') && texto.trim().endsWith(']')) {
        texto = `{"questoes": ${texto}}`;
      } 
      // Se for um array incompleto
      else if (texto.trim().startsWith('[')) {
        texto = `{"questoes": ${texto}]}`;
      }
      // Se for um objeto único (uma questão)
      else if (texto.trim().startsWith('{')) {
        texto = `{"questoes": [${texto}]}`;
      }
    }
    
    try {
      JSON.parse(texto);
      console.log("JSON recuperado com sucesso após correções finais");
      return texto;
    } catch (finalError) {
      console.error("Falha na recuperação final do JSON:", finalError);
      
      // Última tentativa: verificar se temos pelo menos uma questão válida
      try {
        if (texto.includes('"pergunta"')) {
          const perguntaMatch = texto.match(/"pergunta"\s*:\s*"[^"]*"/);
          const alternativasMatch = texto.match(/"alternativas"\s*:\s*\[[^\]]*\]/);
          
          if (perguntaMatch && alternativasMatch) {
            // Construir manualmente uma questão
            const questaoMinima = `{
              ${perguntaMatch[0]},
              ${alternativasMatch[0]},
              "respostaCorreta": 0,
              "explicacao": "Explicação não disponível."
            }`;
            
            return `{"questoes": [${questaoMinima}]}`;
          }
        }
      } catch (e) {
        console.error("Falha na última tentativa de recuperação");
      }
      
      throw new Error("Não foi possível recuperar um JSON válido");
    }
  }
}