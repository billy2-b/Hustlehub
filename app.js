
/*
 * HUSTLEHUB
 * Registration and login using Supabase Auth
 */

(() => {
  "use strict";

  // HUSTLEHUB Supabase project URL
  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

  // Replace this placeholder with your Supabase Publishable key.
  // Never use a Secret or service_role key in browser code.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YdkCAt_7EHlSOB7MDgZ0Rg_EJ89I0NJ";

  const message = document.getElementById("authMessage");

  function say(text, isError = false) {
    if (message) {
      message.textContent = text;
      message.style.color = isError ? "#b42318" : "#176b37";
    }
  }

  // Check configuration
  if (SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR_")) {
    say("Setup incomplete: add your Supabase Publishable key.", true);
    return;
  }

  if (!window.supabase) {
    say("Supabase did not load. Check your internet connection.", true);
    return;
  }

  // Connect to Supabase
  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  window.hustlehubSupabase = client;

  // REGISTRATION
  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nameInput = document.getElementById("signupName");
      const emailInput = document.getElementById("signupEmail");
      const passwordInput = document.getElementById("signupPassword");

      const fullName = nameInput?.value.trim();
      const email = emailInput?.value.trim();
      const password = passwordInput?.value;

      if (!fullName || !email || !password) {
        say("Please complete all registration fields.", true);
        return;
      }

      if (password.length < 8) {
        say("Your password must contain at least 8 characters.", true);
        return;
      }

      const button = signupForm.querySelector(
        'button[type="submit"], button:not([type])'
      );

      if (button) button.disabled = true;
      say("Creating your HUSTLEHUB account...");

      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) throw error;

        if (data.user && !data.session) {
          say(
            "Registration submitted! Check your email for a confirmation link."
          );
        } else {
          say("Account created successfully. You can now log in.");
        }

        signupForm.reset();
      } catch (error) {
        say(
          error.message || "Registration failed. Please try again.",
          true
        );
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  // LOGIN
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("loginEmail")?.value.trim();
      const password = document.getElementById("loginPassword")?.value;

      if (!email || !password) {
        say("Please enter your email and password.", true);
        return;
      }

      const button = loginForm.querySelector(
        'button[type="submit"], button:not([type])'
      );

      if (button) button.disabled = true;
      say("Logging in to HUSTLEHUB...");

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        say("Login successful! Welcome to HUSTLEHUB.");
        loginForm.reset();
      } catch (error) {
        say(
          error.message || "Login failed. Please check your details.",
          true
        );
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  // Check whether a user is already signed in.
  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      say("Could not check your login session.", true);
      return;
    }

    if (data.session) {
      say("You are signed in to HUSTLEHUB.");
    }
  });
})();