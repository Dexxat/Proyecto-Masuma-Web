// Valores PÚBLICOS: la seguridad la dan las políticas RLS de la base, no esta clave.
// supabaseKey = la Publishable key (empieza con sb_publishable_), recomendada por Supabase para apps nuevas.
//   Se copia de Project Settings → API Keys. La anon key "legacy" (empieza con eyJ...) también funciona.
// NUNCA poner aquí la Secret key (sb_secret_...), la service_role ni claves de Mercado Pago / PayPal: tienen privilegios elevados.
export const env = {
  supabaseUrl: 'https://cemfdxieesraqpvbrxwf.supabase.co',
  supabaseKey: 'sb_publishable_KpOFolz1nXNZlTBcXrE6pA_kw6yaUdF',
};
