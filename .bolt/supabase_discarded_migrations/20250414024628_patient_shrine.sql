/*
  # Lousa (Whiteboard) System Schema

  1. New Tables
    - `lousas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `data` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `lousa_history`
      - `id` (uuid, primary key)
      - `lousa_id` (uuid, references lousas)
      - `data` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Create, read, update, and delete their own lousas
      - Create and read history entries for their lousas
*/

-- Create lousas table
CREATE TABLE IF NOT EXISTS lousas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  data jsonb NOT NULL DEFAULT '{"version": "1.0.0", "objects": [], "background": "#ffffff"}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lousa_history table for undo/redo functionality
CREATE TABLE IF NOT EXISTS lousa_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lousa_id uuid REFERENCES lousas(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE lousas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lousa_history ENABLE ROW LEVEL SECURITY;

-- Policies for lousas
CREATE POLICY "Users can create their own lousas"
  ON lousas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lousas"
  ON lousas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own lousas"
  ON lousas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lousas"
  ON lousas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for lousa_history
CREATE POLICY "Users can create history for their lousas"
  ON lousa_history
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM lousas
    WHERE lousas.id = lousa_id
    AND lousas.user_id = auth.uid()
  ));

CREATE POLICY "Users can view history of their lousas"
  ON lousa_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lousas
    WHERE lousas.id = lousa_id
    AND lousas.user_id = auth.uid()
  ));

-- Create updated_at trigger for lousas
CREATE TRIGGER update_lousas_updated_at
  BEFORE UPDATE
  ON lousas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lousas_user_id ON lousas(user_id);
CREATE INDEX IF NOT EXISTS idx_lousa_history_lousa_id ON lousa_history(lousa_id);