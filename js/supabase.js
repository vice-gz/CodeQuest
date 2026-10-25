// supabase.js
// Cliente único de Supabase para todas las páginas. Usa SOLO la clave anon
// (pública): la seguridad real la imponen las políticas RLS de la base de
// datos. La service_role key jamás debe aparecer en el frontend.

import { createClient } from "@supabase/supabase-js";

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const CLAVE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configuracionValida = Boolean(URL_SUPABASE && CLAVE_ANON);

if (!configuracionValida) {
  console.error(
    "CodeQuest: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y reinicia `npm run dev`."
  );
}

// createClient lanza si recibe valores vacíos; con marcadores el resto de la
// app puede mostrar un mensaje claro en vez de romperse al importar.
export const supabase = createClient(
  URL_SUPABASE || "https://sin-configurar.invalid",
  CLAVE_ANON || "sin-configurar",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const HOST_SUPABASE = URL_SUPABASE ? new URL(URL_SUPABASE).host : "(sin configurar)";
