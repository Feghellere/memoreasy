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
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
- Para verdadeiro/falso: Use apenas "Verdadeiro" ou "Falso"
- No modo aleatório: Mantenha proporção igual entre tipos
- Respeite ESTRITAMENTE o nível de dificuldade solicitado

O formato de resposta DEVE ser um objeto JSON com a seguinte estrutura:
{
  "questoes": [
    {
      "pergunta": "Texto da pergunta",
      "alternativas": ["A", "B", "C", "D"],
      "respostaCorreta": 0,
      "explicacao": "Explicação detalhada"
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
        
        const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";
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
            maxOutputTokens: 2048
          }
        };

        console.log("Corpo da requisição Gemini:", JSON.stringify(geminiBody, null, 2));

        const response = await fetch(
          `${geminiUrl}?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(geminiBody)
          }
        );

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
        
        if (!rawText) {
          console.error("Resposta Gemini sem texto:", data);
          throw new Error("Resposta inválida do Gemini");
        }

        const quiz = parseAndValidateQuiz(rawText, config);
        
        return new Response(JSON.stringify(quiz), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (geminiError) {
        console.error("Erro detalhado no Gemini:", geminiError);
        if (!OPENAI_API_KEY) throw geminiError;
        console.log("Fallback para OpenAI...");
      }
    }

    // Fallback para OpenAI
    if (OPENAI_API_KEY) {
      console.log("Iniciando chamada para OpenAI...");
      
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
        })
      });

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

      return new Response(JSON.stringify(quiz), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    throw new Error("Nenhum serviço de IA disponível");
  } catch (error) {
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
      return 'Mix equilibrado de múltipla escolha e verdadeiro/falso';
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
    
    // Extrai o JSON da resposta
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("Nenhum JSON encontrado no texto:", rawText);
      throw new Error("Nenhum JSON encontrado na resposta");
    }

    const json = JSON.parse(match[0]);
    console.log("JSON parseado:", JSON.stringify(json, null, 2));

    if (!json?.questoes || !Array.isArray(json.questoes)) {
      console.error("Estrutura JSON inválida:", json);
      throw new Error("Formato de resposta inválido");
    }

    // Valida cada questão
    json.questoes = json.questoes.map((questao: QuizQuestion, index: number) => {
      console.log(`Validando questão ${index + 1}:`, questao);

      if (!questao.pergunta || typeof questao.pergunta !== 'string') {
        throw new Error(`Questão ${index + 1}: Pergunta inválida`);
      }

      if (!Array.isArray(questao.alternativas)) {
        throw new Error(`Questão ${index + 1}: Alternativas inválidas`);
      }

      if (config.tipoQuestao === 'multipla' && questao.alternativas.length !== 4) {
        throw new Error(`Questão ${index + 1}: Número incorreto de alternativas`);
      }

      if (typeof questao.respostaCorreta !== 'number' || 
          questao.respostaCorreta < 0 || 
          questao.respostaCorreta >= questao.alternativas.length) {
        throw new Error(`Questão ${index + 1}: Resposta correta inválida`);
      }

      if (!questao.explicacao || typeof questao.explicacao !== 'string') {
        throw new Error(`Questão ${index + 1}: Explicação inválida`);
      }

      return questao;
    });

    // Valida número de questões se não for automático
    if (!config.iaAutomatica && json.questoes.length !== config.numeroQuestoes) {
      console.error(
        `Número incorreto de questões: esperado ${config.numeroQuestoes}, recebido ${json.questoes.length}`
      );
      throw new Error("Número incorreto de questões geradas");
    }

    return json;
  } catch (error) {
    console.error("Erro na validação:", error);
    throw new Error(`Erro ao validar quiz: ${error.message}`);
  }
}