/*
 HUSTLEHUB Supabase starter.
 Add your Supabase Project URL and publishable key below.
 Never use a service_role key or Daraja secrets here.
*/
(() => {
  const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";
  const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";

  const message = document.getElementById("authMessage");
  const say = (text) => {
    if (message) message.textContent = text;
  };

  if (
    SUPABASE_URL.includes("PASTE_YOUR_") ||
    SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR_")
  ) {
    say("HUSTLEHUB setup is incomplete. Supabase still needs to be connected.");
    return;
  }

  if (!window.supabase) {
    say("Supabase library did not load. Please check your internet connection.");
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  window.hustlehubSupabase = client;

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const fullName = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;

      say("Creating account...");

      const { error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });

      say(error ? error.message : "Registration submitted. Check your email if confirmation is enabled.");
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      say("Logging in...");

      const { error } = await client.auth.signInWithPassword({
        email,
        password
      });

      say(error ? error.message : "You are logged in.");
    });
  }
})();
