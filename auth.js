// AB Performance — Shared Supabase Auth & Data Helper
const SUPABASE_URL = 'https://yfurwxlchsnhhqwrqzcz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdXJ3eGxjaHNuaGhxd3JxemN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MDU4MjQsImV4cCI6MjA5NzE4MTgyNH0.tFCsOkaLPNElDoPdsWkbptup_BUisIqSTeYP2UrdOlE';
const PT_EMAIL = 'alexbrown399@gmail.com';

window.supabaseClient = null;
window.currentUser = null;

function initSupabase(callback) {
  if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storageKey: 'ab-performance-auth',
        storage: window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  window.supabaseClient.auth.getSession().then(({ data }) => {
    window.currentUser = data.session ? data.session.user : null;
    setTimeout(() => {
      updateNavAuth(window.currentUser);
      if (callback) callback(window.currentUser);
    }, 50);
  });
}

function updateNavAuth(user) {
  const loginBtn = document.getElementById('navLoginBtn');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const userLabel = document.getElementById('navUserLabel');
  if (!loginBtn) return;
  if (user) {
    loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline';
    if (userLabel) {
      const name = (user.user_metadata && user.user_metadata.full_name)
        ? user.user_metadata.full_name.replace(' (PT Admin)', '')
        : user.email.split('@')[0];
      userLabel.textContent = 'Logged in as ' + name;
      userLabel.style.display = 'inline';
    }
    if (user.email === PT_EMAIL && !document.getElementById('ptBadge')) {
      const badge = document.createElement('div');
      badge.id = 'ptBadge';
      badge.style.cssText = 'position:fixed;bottom:1rem;right:1rem;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4);color:#fcd34d;font-size:.7rem;font-weight:700;padding:.4rem .8rem;border-radius:20px;z-index:999;letter-spacing:.06em';
      badge.textContent = '🔑 PT Mode';
      document.body.appendChild(badge);
    }
  } else {
    loginBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userLabel) userLabel.style.display = 'none';
  }
}

// AUTH HELPERS
async function signUp(email, password, fullName) {
  const { data, error } = await window.supabaseClient.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } }
  });
  return { data, error };
}

async function signIn(email, password) {
  const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function signOut() {
  await window.supabaseClient.auth.signOut();
  const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  window.location.href = base + 'index.html';
}

async function getCurrentUser() {
  if (window.currentUser) return window.currentUser;
  const { data } = await window.supabaseClient.auth.getSession();
  return data.session ? data.session.user : null;
}

// DATA HELPERS
async function saveLoggedWeight(programme, sessionKey, exerciseKey, weight, rpe, notes) {
  const user = await getCurrentUser();
  if (!user) return null;
  return window.supabaseClient.from('logged_weights').upsert({
    user_id: user.id, programme, session_key: sessionKey,
    exercise_key: exerciseKey, weight, rpe, notes,
    logged_at: new Date().toISOString()
  }, { onConflict: 'user_id,programme,session_key,exercise_key' });
}

async function getLoggedWeights(programme) {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await window.supabaseClient.from('logged_weights')
    .select('*').eq('user_id', user.id).eq('programme', programme);
  return data || [];
}

async function saveProfile(profileData) {
  const user = await getCurrentUser();
  if (!user) return null;
  return window.supabaseClient.from('client_profiles')
    .upsert({ id: user.id, ...profileData, updated_at: new Date().toISOString() });
}

async function getProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await window.supabaseClient.from('client_profiles')
    .select('*').eq('id', user.id).maybeSingle();
  return data;
}
