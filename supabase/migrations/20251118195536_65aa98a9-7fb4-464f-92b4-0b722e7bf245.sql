-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela de telas (screens)
CREATE TABLE public.screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  current_playlist_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver telas"
  ON public.screens FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar telas"
  ON public.screens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem atualizar telas"
  ON public.screens FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar telas"
  ON public.screens FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de arquivos
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  thumbnail_url TEXT,
  duration INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver arquivos"
  ON public.files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar arquivos"
  ON public.files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Usuários autenticados podem deletar arquivos"
  ON public.files FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de layouts
CREATE TABLE public.layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  layout_data JSONB NOT NULL,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver layouts"
  ON public.layouts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar layouts"
  ON public.layouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem atualizar layouts"
  ON public.layouts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar layouts"
  ON public.layouts FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de playlists
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver playlists"
  ON public.playlists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar playlists"
  ON public.playlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem atualizar playlists"
  ON public.playlists FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar playlists"
  ON public.playlists FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de itens de playlist
CREATE TABLE public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  layout_id UUID REFERENCES public.layouts(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver itens de playlist"
  ON public.playlist_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar itens de playlist"
  ON public.playlist_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar itens de playlist"
  ON public.playlist_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar itens de playlist"
  ON public.playlist_items FOR DELETE
  TO authenticated
  USING (true);

-- Adicionar foreign key para current_playlist_id em screens
ALTER TABLE public.screens
  ADD CONSTRAINT fk_current_playlist
  FOREIGN KEY (current_playlist_id)
  REFERENCES public.playlists(id)
  ON DELETE SET NULL;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screens_updated_at
  BEFORE UPDATE ON public.screens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_layouts_updated_at
  BEFORE UPDATE ON public.layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();