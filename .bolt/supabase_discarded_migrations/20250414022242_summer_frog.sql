/*
  # Add Quadros (Whiteboards) Table

  1. New Tables
    - `quadros`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `data` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Create their own quadros
      - Read their own quadros
      - Update their own quadros
      - Delete their own quadros
*/

-- Create quadros table
CREATE TABLE IF NOT EXISTS quadros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE quadros ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own quadros"
  ON quadros
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quadros"
  ON quadros
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quadros"
  ON quadros
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quadros"
  ON quadros
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_quadros_updated_at
  BEFORE UPDATE
  ON quadros
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quadros_user_id ON quadros(user_id);