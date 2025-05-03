/*
  # Quiz System Database Schema

  1. New Tables
    - `quizzes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `questions`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `question` (text)
      - `options` (jsonb)
      - `correct_answer` (integer)
      - `explanation` (text)
      - `created_at` (timestamptz)
    
    - `user_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `quiz_id` (uuid, references quizzes)
      - `question_id` (uuid, references questions)
      - `selected_answer` (integer)
      - `is_correct` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read their own quizzes and responses
      - Create new quizzes and responses
      - Update their own quizzes
*/

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now()
);

-- Create user_responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer integer NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes
CREATE POLICY "Users can view their own quizzes"
  ON quizzes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for questions
CREATE POLICY "Users can view questions for their quizzes"
  ON questions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_id
    AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can create questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_id
    AND quizzes.user_id = auth.uid()
  ));

-- Policies for user_responses
CREATE POLICY "Users can view their own responses"
  ON user_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create responses"
  ON user_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for quizzes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE
  ON quizzes
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_user_id ON user_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_quiz_id ON user_responses(quiz_id);