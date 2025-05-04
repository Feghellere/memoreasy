import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tipo, texto } = await req.json();
    
    // Configuração das chaves de API (seguras no backend)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!GEMINI_API_KEY || !OPENAI_API_KEY) {
      throw new Error('Chaves de API não configuradas');
    }

    let resultado;
    
    try {
      // Tenta primeiro com Gemini
      resultado = await processarComGemini(texto, tipo, GEMINI_API_KEY);
    } catch (error) {
      console.error('Erro no Gemini, usando fallback OpenAI:', error);
      // Fallback para OpenAI
      resultado = await processarComOpenAI(texto, tipo, OPENAI_API_KEY);
    }

    return new Response(
      JSON.stringify({ resultado }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function processarComGemini(texto: string, tipo: string, apiKey: string) {
  // Implementação da chamada à API do Gemini
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${tipo}: ${texto}`
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Falha na chamada do Gemini');
  }

  return await response.json();
}

async function processarComOpenAI(texto: string, tipo: string, apiKey: string) {
  // Implementação do fallback com OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `${tipo}: ${texto}`
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Falha na chamada da OpenAI');
  }

  return await response.json();
}