-- Criar tabela para API Keys (segurança)
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas para api_keys
CREATE POLICY "Usuários autenticados podem ver api keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar api keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem atualizar api keys"
  ON public.api_keys FOR UPDATE
  TO authenticated
  USING (true);

-- Função para validar API key
CREATE OR REPLACE FUNCTION public.validate_api_key(api_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE key = api_key 
    AND is_active = true
  );
$$;

-- Função para atualizar last_used_at da API key
CREATE OR REPLACE FUNCTION public.update_api_key_usage(api_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.api_keys 
  SET last_used_at = now() 
  WHERE key = api_key;
$$;