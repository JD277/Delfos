const SUPABASE_URL = 'https://voedeobojnlsjfxhkbhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZWRlb2Jvam5sc2pmeGhrYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODM3MzcsImV4cCI6MjA3MTU1OTczN30.ySOeKnQLKomzyh3tFSaNJdiHD5amS2fmSpKFzFZJNLA';

// Verificamos si la librería de Supabase se cargó desde el CDN
if (typeof window.supabase !== 'undefined') {
    // Inicializamos y lo guardamos en una variable global 'sbClient'
    window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase inicializado globalmente.");
} else {
    console.error("❌ La librería de Supabase no está cargada. Asegúrate de incluir el script del CDN en el HTML antes de este archivo.");
}
