export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
  user_responses: UserResponse[];
}

export interface Question {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  created_at: string;
  tipoQuestao?: 'multipla' | 'verdadeiro_falso';
}

export interface UserResponse {
  id: string;
  user_id: string;
  quiz_id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  created_at: string;
}