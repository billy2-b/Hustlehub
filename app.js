
/*
 * HUSTLEHUB
 * Supabase registration, login and published jobs
 */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

  // Replace this placeholder with your existing PUBLISHABLE key.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YdkCAt_7EHlSOB7MDgZ0Rg_EJ89I0NJ";

  const message = document.getElementById("authMessage");

  function showMessage(text, isError = false) {
    if (message) {
      message.textContent = text;
      message.style.color = isError ? "#b42318" : "#176b37";
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

  if (
    !SUPABASE_URL.startsWith("https://") ||
    !SUPABASE_URL.endsWith(".supabase.co") ||
    SUPABASE_PUBLISHABLE_KEY === "YOUR_PUBLISHABLE_KEY"
  ) {
    showMessage(
      "Setup incomplete. Check your Supabase URL and Publishable key.",
      true
    );
    return;
  }

  if (!window.supabase) {
    showMessage(
      "Supabase could not load. Check your internet and refresh.",
      true
    );
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  window.hustlehubSupabase = client;

  // -------------------------
  // LOAD PUBLISHED JOBS
  // -------------------------

  async function loadJobs() {
    const jobsList = document.getElementById("jobsList");
    const jobsMessage = document.getElementById("jobsMessage");

    if (!jobsList || !jobsMessage) return;

    jobsMessage.textContent = "Loading available jobs...";
    jobsList.replaceChildren();

    try {
      const { data: jobs, error } = await client
        .from("jobs")
        .select(
          "id, title, company_name, county, work_type, category, description, application_url, verified, created_at"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!jobs || jobs.length === 0) {
        jobsMessage.textContent =
          "No published jobs are available yet. Please check again soon.";
        return;
      }

      jobsMessage.textContent =
        `${jobs.length} published job${jobs.length === 1 ? "" : "s"} found.`;

      jobs.forEach((job) => {
        const card = document.createElement("article");
        card.className = "job-card";

        const title = document.createElement("h3");
        title.textContent = job.title;

        const company = document.createElement("p");
        company.textContent =
          `${job.company_name} · ${job.county || "Kenya"}`;

        const details = document.createElement("p");
        details.textContent =
          `${job.work_type || "Not specified"} · ${job.category || "General"}`;

        const description = document.createElement("p");
        description.textContent = job.description;

        card.append(title, company, details, description);

        if (job.verified) {
          const verified = document.createElement("p");
          verified.textContent = "Verified listing";
          card.appendChild(verified);
        } else {
          const note = document.createElement("p");
          note.textContent =
            "Verification not confirmed by HUSTLEHUB.";
          card.appendChild(note);
        }

        if (job.application_url) {
          try {
            const applicationURL = new URL(job.application_url);

            if (
              applicationURL.protocol === "https:" ||
              applicationURL.protocol === "http:"
            ) {
              const link = document.createElement("a");
              link.href = applicationURL.href;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              link.textContent = "View application details";
              card.appendChild(link);
            }
          } catch {
            // Ignore invalid application links.
          }
        }

        jobsList.appendChild(card);
      });

    } catch (error) {
      console.error("HUSTLEHUB jobs error:", error);

      jobsMessage.textContent =
        "We couldn't load jobs right now. Please refresh and try again.";
    }
  }

  loadJobs();

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

      setButtonLoading(signupForm, true, "Creating account...");
      showMessage("Connecting securely to HUSTLEHUB...");

      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
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
          error.message || "Registration failed. Please try again.",
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
            email,
            password
          });

        if (error) throw error;

        if (data.user) {
          showMessage("Login successful! Welcome to HUSTLEHUB.");
          loginForm.reset();
        }

      } catch (error) {
        console.error("HUSTLEHUB login error:", error);
        showMessage(
          error.message || "Login failed. Please try again.",
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
