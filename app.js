
/*
 * HUSTLEHUB
 * Supabase authentication, published jobs and admin dashboard
 */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

  // Keep your existing Supabase PUBLISHABLE key here.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YdkCAt_7EHlSOB7MDgZ0Rg_EJ89I0NJ";

  const authMessage = document.getElementById("authMessage");

  function showAuthMessage(text, isError = false) {
    if (authMessage) {
      authMessage.textContent = text;
      authMessage.style.color = isError ? "#b42318" : "#176b37";
    }
  }

  function setButtonLoading(form, loading, text) {
    const button = form.querySelector(
      'button[type="submit"], button:not([type])'
    );

    if (!button) return;

    if (loading) {
      if (!button.disabled) {
        button.dataset.originalText = button.textContent;
      }
      button.disabled = true;
      button.textContent = text;
    } else {
      button.disabled = false;
      button.textContent =
        button.dataset.originalText || button.textContent;
    }
  }

  if (
    !window.supabase ||
    !SUPABASE_URL.startsWith("https://") ||
    SUPABASE_PUBLISHABLE_KEY ===
      "PASTE_YOUR_EXISTING_PUBLISHABLE_KEY_HERE" ||
    !SUPABASE_PUBLISHABLE_KEY
  ) {
    showAuthMessage(
      "Setup incomplete. Check the Supabase library, URL and publishable key.",
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

        const verification = document.createElement("p");
        verification.textContent = job.verified
          ? "Verified listing"
          : "Verification not confirmed by HUSTLEHUB.";
        card.appendChild(verification);

        if (job.application_url) {
          try {
            const url = new URL(job.application_url);

            if (["https:", "http:"].includes(url.protocol)) {
              const link = document.createElement("a");
              link.href = url.href;
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

  // -------------------------
  // CHECK ADMIN ACCESS
  // -------------------------

  async function checkHustleHubAdmin() {
    const message = document.getElementById("adminMessage");
    const panel = document.getElementById("adminPanel");

    if (!message || !panel) return;

    panel.hidden = true;

    try {
      message.textContent = "Checking administrator access...";

      const { data, error } = await client.auth.getSession();

      if (error) throw error;

      const user = data.session?.user;

      if (!user) {
        message.textContent =
          "Please log in with your authorized administrator account.";
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Admin profile error:", profileError);
        message.textContent =
          "Profile check failed: " + profileError.message;
        return;
      }

      if (!profile) {
        message.textContent =
          "No profile found for your logged-in account.";
        return;
      }

      if (profile.role !== "admin") {
        message.textContent =
          "Access denied. Your account role is: " + profile.role;
        return;
      }

      message.textContent =
        "Administrator verified. You can manage jobs.";
      panel.hidden = false;
    } catch (error) {
      console.error("HUSTLEHUB admin check failed:", error);
      message.textContent =
        "Could not verify admin access: " +
        (error.message || "Unknown error");
    }
  }

  // -------------------------
  // ADD A JOB
  // -------------------------

  async function addHustleHubJob(event) {
    event.preventDefault();

    const message = document.getElementById("adminMessage");
    const form = document.getElementById("adminJobForm");

    if (!form || !message) return;

    try {
      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData.session?.user;

      if (!user) {
        message.textContent = "Please log in again.";
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role !== "admin") {
        message.textContent = "Access denied.";
        return;
      }

      const title =
        document.getElementById("adminJobTitle").value.trim();
      const company =
        document.getElementById("adminCompany").value.trim();
      const county =
        document.getElementById("adminCounty").value.trim();
      const workType =
        document.getElementById("adminWorkType").value;
      const category =
        document.getElementById("adminCategory").value.trim();
      const description =
        document.getElementById("adminDescription").value.trim();
      const applicationUrl =
        document.getElementById("adminApplicationUrl").value.trim();
      const status =
        document.getElementById("adminJobStatus").value;

      if (!title || !company || !description) {
        message.textContent =
          "Please complete the required job details.";
        return;
      }

      if (!["draft", "published"].includes(status)) {
        message.textContent = "Invalid listing status.";
        return;
      }

      if (applicationUrl) {
        try {
          const url = new URL(applicationUrl);

          if (!["https:", "http:"].includes(url.protocol)) {
            throw new Error("Invalid URL protocol");
          }
        } catch {
          message.textContent =
            "Enter a valid application link beginning with https:// or http://.";
          return;
        }
      }

      const submitButton = form.querySelector(
        'button[type="submit"], button:not([type])'
      );

      if (submitButton) submitButton.disabled = true;

      message.textContent = "Saving job...";

      const { error } = await client.from("jobs").insert({
        title,
        company_name: company,
        county: county || "Kenya",
        work_type: workType,
        category: category || "General",
        description,
        application_url: applicationUrl || null,
        status
      });

      if (error) throw error;

      message.textContent =
        status === "published"
          ? "Job published successfully!"
          : "Job saved as a draft successfully!";

      form.reset();
      await loadJobs();
    } catch (error) {
      console.error("HUSTLEHUB save-job error:", error);
      message.textContent =
        "Could not save job: " +
        (error.message || "Check your database permissions.");
    } finally {
      const form = document.getElementById("adminJobForm");
      if (form) {
        const button = form.querySelector(
          'button[type="submit"], button:not([type])'
        );
        if (button) button.disabled = false;
      }
    }
  }

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
        showAuthMessage("Please fill in all registration fields.", true);
        return;
      }

      if (password.length < 8) {
        showAuthMessage(
          "Your password must contain at least 8 characters.",
          true
        );
        return;
      }

      setButtonLoading(signupForm, true, "Creating account...");
      showAuthMessage("Connecting securely to HUSTLEHUB...");

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
          showAuthMessage(
            "Registration received! Check your email for a confirmation link."
          );
        } else if (data.user) {
          showAuthMessage(
            "Your account was created successfully. You can now log in."
          );
        } else {
          showAuthMessage(
            "Registration submitted. Follow any instructions shown."
          );
        }

        signupForm.reset();
      } catch (error) {
        console.error("HUSTLEHUB registration error:", error);
        showAuthMessage(
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
        showAuthMessage("Please enter your email and password.", true);
        return;
      }

      setButtonLoading(loginForm, true, "Logging in...");
      showAuthMessage("Signing in to HUSTLEHUB...");

      try {
        const { data, error } =
          await client.auth.signInWithPassword({ email, password });

        if (error) throw error;

        if (data.user) {
          showAuthMessage("Login successful! Welcome to HUSTLEHUB.");
          loginForm.reset();
          await checkHustleHubAdmin();
        }
      } catch (error) {
        console.error("HUSTLEHUB login error:", error);
        showAuthMessage(
          error.message || "Login failed. Please try again.",
          true
        );
      } finally {
        setButtonLoading(loginForm, false);
      }
    });
  }

  // -------------------------
  // INITIALIZE WEBSITE
  // -------------------------

  async function initializeHustleHub() {
    const adminForm = document.getElementById("adminJobForm");

    if (adminForm) {
      adminForm.addEventListener("submit", addHustleHubJob);
    }

    await loadJobs();
    await checkHustleHubAdmin();

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.error("Session check error:", error);
      return;
    }

    if (data.session) {
      showAuthMessage("You are signed in to HUSTLEHUB.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeHustleHub,
      { once: true }
    );
  } else {
    initializeHustleHub();
  }

  // Refresh the admin panel whenever authentication changes.
  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      setTimeout(checkHustleHubAdmin, 0);
    }
  });

})();
