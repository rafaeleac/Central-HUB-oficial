-- Adiciona campos para apps em playlist_items
ALTER TABLE public.playlist_items
  ADD COLUMN app_type TEXT,
  ADD COLUMN app_config JSONB DEFAULT '{}';

-- Permitir uso dos novos campos com RLS (já existe política permissiva para insert/update/select)
