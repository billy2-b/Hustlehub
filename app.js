
/*
 * HUSTLEHUB
 * Supabase registration and login
 */

(() => {
  "use strict";

  // Use your exact Supabase Project URL.
  // Do not include /rest/v1/ or /auth/v1/.
  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

  // Paste your Supabase PUBLISHABLE key below.
  // Never use a secret or service_role key here.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YdkCAt_7EHlSOB7MDgZ0Rg_EJ89I0NJ";

  const message = document.getElementById("authMessage");

  function showMessage(text, isError = false) {
    if (message) {
      message.textContent = text;
      message.style.color = isError ? "#b42318" : "#176b37";
    } else {
      alert(text);
    }
  }

  function setButtonLoading(form, loading, text) {
    const button = form.querySelector(
      'button[type="submit"], button:not([type])'
    );

    if (button) {
      if (loading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.textContent = text;
      } else {
        button.disabled = false;
        button.textContent =
          button.dataset.originalText || button.textContent;
      }
    }
  }

  // Check configuration before connecting.
  if (
    !SUPABASE_URL.startsWith("https://") ||
    !SUPABASE_URL.endsWith(".supabase.co") ||
    SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR_")
  ) {
    showMessage(
      "Setup incomplete. Check your Supabase URL and Publishable key.",
      true
    );
    return;
  }

  if (!window.supabase) {
    showMessage(
      "Supabase could not load. Check your internet connection and refresh the page.",
      true
    );
    return;
  }

  // Create the Supabase client.
  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  // Make the client available for future HUSTLEHUB features.
  window.hustlehubSupabase = client;

  // -------------------------
  // REGISTRATION
  // -------------------------

  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const fullName =
        document.getElementById("signupName")?.value.trim();

      const email =
        document.getElementById("signupEmail")?.value.trim();

      const password =
        document.getElementById("signupPassword")?.value;

      if (!fullName || !email || !password) {
        showMessage("Please fill in all registration fields.", true);
        return;
      }

      if (password.length < 8) {
        showMessage(
          "Your password must contain at least 8 characters.",
          true
        );
        return;
      }

      setButtonLoading(
        signupForm,
        true,
        "Creating account..."
      );

      showMessage("Connecting securely to HUSTLEHUB...");

      try {
        const { data, error } = await client.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) throw error;

        if (data.user && !data.session) {
          showMessage(
            "Registration received! Check your email for a confirmation link."
          );
        } else if (data.user) {
          showMessage(
            "Your account was created successfully. You can now log in."
          );
        } else {
          showMessage(
            "Registration submitted. Follow any instructions shown."
          );
        }

        signupForm.reset();

      } catch (error) {
        console.error("HUSTLEHUB registration error:", error);

        showMessage(
          error.message ||
          "Registration failed. Please check your connection and try again.",
          true
        );
      } finally {
        setButtonLoading(signupForm, false);
      }
    });
  }

  // -------------------------
  // LOGIN
  // -------------------------

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email =
        document.getElementById("loginEmail")?.value.trim();

      const password =
        document.getElementById("loginPassword")?.value;

      if (!email || !password) {
        showMessage("Please enter your email and password.", true);
        return;
      }

      setButtonLoading(loginForm, true, "Logging in...");

      showMessage("Signing in to HUSTLEHUB...");

      try {
        const { data, error } =
          await client.auth.signInWithPassword({
            email: email,
            password: password
          });

        if (error) throw error;

        if (data.user) {
          showMessage(
            "Login successful! Welcome to HUSTLEHUB."
          );
          loginForm.reset();
        }

      } catch (error) {
        console.error("HUSTLEHUB login error:", error);

        showMessage(
          error.message ||
          "Login failed. Please check your details and try again.",
          true
        );
      } finally {
        setButtonLoading(loginForm, false);
      }
    });
  }

  // -------------------------
  // CHECK EXISTING SESSION
  // -------------------------

  client.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error("Session check error:", error);
        return;
      }

      if (data.session) {
        showMessage("You are signed in to HUSTLEHUB.");
      }
    })
    .catch((error) => {
      console.error("Session check failed:", error);
    });

})();
