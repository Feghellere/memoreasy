/*
  # Fix Lousa System Database Schema

  1. Changes
    - Add IF NOT EXISTS checks for policies
    - Keep table and index creation
    - Ensure safe policy creation
*/

-- Create lousas table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS lousas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    data jsonb NOT NULL DEFAULT '{"version": "1.0.0", "objects": [], "background": "#ffffff"}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create lousa_history table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS lousa_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lousa_id uuid REFERENCES lousas(id) ON DELETE CASCADE NOT NULL,
    data jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS if not already enabled
DO $$ BEGIN
  ALTER TABLE lousas ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE lousa_history ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Safely create policies for lousas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lousas' AND policyname = 'Users can create their own lousas'
  ) THEN
    CREATE POLICY "Users can create their own lousas"
      ON lousas
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lousas' AND policyname = 'Users can view their own lousas'
  ) THEN
    CREATE POLICY "Users can view their own lousas"
      ON lousas
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lousas' AND policyname = 'Users can update their own lousas'
  ) THEN
    CREATE POLICY "Users can update their own lousas"
      ON lousas
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lousas' AND policyname = 'Users can delete their own lousas'
  ) THEN
    CREATE POLICY "Users can delete their own lousas"
      ON lousas
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Safely create policies for lousa_history
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lousa_history' AND policyname = 'Users can create history for their lousas'
  ) THEN
    CREATE POLICY "Users can create history for their lousas"
      ON lousa_history
      FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM lousas
        WHERE lousas.id = lousa_id
        AND lousas.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lousa_history' AND policyname = 'Users can view history of their lousas'
  ) THEN
    CREATE POLICY "Users can view history of their lousas"
      ON lousa_history
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM lousas
        WHERE lousas.id = lousa_id
        AND lousas.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$ BEGIN
  CREATE TRIGGER update_lousas_updated_at
    BEFORE UPDATE
    ON lousas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_lousas_user_id ON lousas(user_id);
CREATE INDEX IF NOT EXISTS idx_lousa_history_lousa_id ON lousa_history(lousa_id);