import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing env vars" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { device, events } = body; // device: { screen_id, app_version, os, resolution, used_space, free_space, mac, info }

    // Upsert device status
    if (device && device.screen_id) {
      const statusResp = await fetch(`${SUPABASE_URL}/rest/v1/device_status?select=*`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
          apikey: SERVICE_ROLE,
          Prefer: "resolution=merge-duplicates", // upsert style
        },
        body: JSON.stringify({
          screen_id: device.screen_id,
          app_version: device.app_version || null,
          os: device.os || null,
          resolution: device.resolution || null,
          used_space: device.used_space || null,
          free_space: device.free_space || null,
          mac: device.mac || null,
          info: device.info || null,
          last_seen: device.last_seen || new Date().toISOString(),
        }),
      });

      // ignore response body for now
    }

    // Insert play events array
    if (Array.isArray(events) && events.length > 0) {
      // normalize events to insertable shape
      const payload = events.map((e: any) => ({
        screen_id: e.screen_id || null,
        file_id: e.file_id || null,
        playlist_id: e.playlist_id || null,
        layout_id: e.layout_id || null,
        started_at: e.started_at || null,
        duration_seconds: e.duration_seconds || null,
        occurrences: e.occurrences || 1,
        meta: e.meta || null,
      }));

      await fetch(`${SUPABASE_URL}/rest/v1/play_events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
          apikey: SERVICE_ROLE,
        },
        body: JSON.stringify(payload),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
