/*
  # Create Lousa Tables

  1. New Tables
    - `lousas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `data` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `lousa_history`
      - `id` (uuid, primary key)
      - `lousa_id` (uuid, foreign key to lousas)
      - `data` (jsonb)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on lousas.user_id for faster user-based queries
    - Index on lousa_history.lousa_id for faster history lookups

  3. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations based on user ownership
*/

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create lousas table
CREATE TABLE IF NOT EXISTS public.lousas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  data jsonb NOT NULL DEFAULT '{"objects": [], "version": "1.0.0", "background": "#ffffff"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_lousas_user_id ON public.lousas(user_id);

-- Enable RLS
ALTER TABLE public.lousas ENABLE ROW LEVEL SECURITY;

-- Create policies for lousas
CREATE POLICY "Users can create their own lousas"
  ON public.lousas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lousas"
  ON public.lousas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own lousas"
  ON public.lousas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lousas"
  ON public.lousas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_lousas_updated_at
  BEFORE UPDATE ON public.lousas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create lousa_history table
CREATE TABLE IF NOT EXISTS public.lousa_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lousa_id uuid NOT NULL REFERENCES public.lousas(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index on lousa_id
CREATE INDEX IF NOT EXISTS idx_lousa_history_lousa_id ON public.lousa_history(lousa_id);

-- Enable RLS
ALTER TABLE public.lousa_history ENABLE ROW LEVEL SECURITY;

-- Create policies for lousa_history
CREATE POLICY "Users can create history for their lousas"
  ON public.lousa_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lousas
      WHERE lousas.id = lousa_history.lousa_id
      AND lousas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history of their lousas"
  ON public.lousa_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lousas
      WHERE lousas.id = lousa_history.lousa_id
      AND lousas.user_id = auth.uid()
    )
  );