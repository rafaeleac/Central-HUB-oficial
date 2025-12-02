import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validar API key
    const { data: isValid } = await supabase.rpc('validate_api_key', { api_key: apiKey });
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar last_used_at
    await supabase.rpc('update_api_key_usage', { api_key: apiKey });

    const url = new URL(req.url);
    const playlistId = url.searchParams.get('playlist_id');

    if (!playlistId) {
      return new Response(
        JSON.stringify({ error: 'Playlist ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar itens da playlist
    const { data: items, error: itemsError } = await supabase
      .from('playlist_items')
      .select(`
        *,
        files (*),
        layouts (*)
      `)
      .eq('playlist_id', playlistId)
      .order('order_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching playlist items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch playlist items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Playlist items found:', items?.length || 0);

    return new Response(
      JSON.stringify({ items: items || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-playlist-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});