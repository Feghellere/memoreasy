import { supabase } from './supabaseClient';

interface QuizQuestion {
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao?: string;
  tipoQuestao?: 'multipla' | 'verdadeiro_falso';
}

export async function saveQuiz(title: string, description: string, questions: QuizQuestion[]) {
  try {
    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Create questions
    const questionsToInsert = questions.map(q => ({
      quiz_id: quiz.id,
      question: q.pergunta,
      options: q.alternativas,
      correct_answer: q.respostaCorreta,
      explanation: q.explicacao,
      tipo_questao: q.tipoQuestao || 'multipla',
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return quiz.id;
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
}

export async function saveQuizResponses(
  quizId: string,
  responses: { questionId: string; selectedAnswer: number; isCorrect: boolean }[]
) {
  try {
    const responsesToInsert = responses.map(r => ({
      quiz_id: quizId,
      question_id: r.questionId,
      selected_answer: r.selectedAnswer,
      is_correct: r.isCorrect,
    }));

    const { error } = await supabase
      .from('user_responses')
      .insert(responsesToInsert);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving quiz responses:', error);
    throw error;
  }
}

export async function getUserQuizzes() {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (
          id,
          question,
          options,
          correct_answer,
          explanation,
          tipo_questao
        ),
        user_responses (
          question_id,
          selected_answer,
          is_correct
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Mapear o campo tipo_questao para tipoQuestao para manter consistência com o frontend
    const quizzesFormatados = data?.map(quiz => ({
      ...quiz,
      questions: quiz.questions.map((question: {
        id: string;
        quiz_id: string;
        question: string;
        options: string[];
        correct_answer: number;
        explanation: string | null;
        tipo_questao?: string;
      }) => ({
        ...question,
        tipoQuestao: question.tipo_questao || 'multipla'
      }))
    }));
    
    return quizzesFormatados;
  } catch (error) {
    console.error('Error fetching user quizzes:', error);
    throw error;
  }
}