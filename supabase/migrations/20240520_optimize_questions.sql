-- Adicionar um índice para melhorar a performance das consultas por tipo de questão
CREATE INDEX IF NOT EXISTS idx_questions_tipo_questao 
ON questions(tipo_questao);

-- Adicionar um índice composto para melhorar consultas que filtram por quiz_id e tipo_questao 
CREATE INDEX IF NOT EXISTS idx_quiz_question_type 
ON questions(quiz_id, tipo_questao);

-- Verificar e corrigir valores nulos
UPDATE questions 
SET tipo_questao = 'multipla' 
WHERE tipo_questao IS NULL; 