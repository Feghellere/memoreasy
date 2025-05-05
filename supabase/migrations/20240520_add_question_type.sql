-- Adicionar a coluna tipoQuestao para identificar o tipo de cada questão
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS tipo_questao text DEFAULT 'multipla' NOT NULL;

-- Comentário de documentação
COMMENT ON COLUMN questions.tipo_questao IS 'Tipo de questão: "multipla" ou "verdadeiro_falso"';

-- Atualizar a função getUserQuizzes para também selecionar o tipo de questão
CREATE OR REPLACE FUNCTION get_user_quizzes() 
RETURNS SETOF quizzes
LANGUAGE sql
SECURITY definer
SET search_path = public
AS $$
  SELECT *
  FROM quizzes
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
$$; 