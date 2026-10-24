
/*
 * HUSTLEHUB
 * Authentication, public jobs, admin job management
 */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

  // Replace this placeholder with your existing publishable key.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YdkCAt_7EHlSOB7MDgZ0Rg_EJ89I0NJ";

  const SITE_URL =
    "https://billy2-b.github.io/Hustlehub/";

  const authMessage = document.getElementById("authMessage");

  function showAuthMessage(text, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = text;
    authMessage.style.color = isError ? "#b42318" : "#176b37";
  }

  function setButtonLoading(form, loading, text) {
    const button = form?.querySelector('button[type="submit"]');
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
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY ===
      "PASTE_YOUR_EXISTING_SUPABASE_PUBLISHABLE_KEY_HERE"
  ) {
    showAuthMessage(
      "Setup incomplete. Add your Supabase publishable key in app.js.",
      true
    );
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  window.hustlehubSupabase = client;

  // ACCOUNT VIEW

  function updateAccountUI(user) {
    const authForms = document.getElementById("authForms");
    const signedInPanel =
      document.getElementById("signedInPanel");
    const signedInMessage =
      document.getElementById("signedInMessage");

    if (!authForms || !signedInPanel) return;

    authForms.hidden = Boolean(user);
    signedInPanel.hidden = !user;

    if (user && signedInMessage) {
      signedInMessage.textContent =
        "You are signed in as " +
        (user.email || "a HUSTLEHUB user") + ".";
    }
  }

  // LOAD PUBLIC JOBS

  async function loadJobs() {
    const list = document.getElementById("jobsList");
    const message = document.getElementById("jobsMessage");

    if (!list || !message) return;

    message.textContent = "Loading available jobs...";
    list.replaceChildren();

    try {
      const { data: jobs, error } = await client
        .from("jobs")
        .select(
          "id,title,company_name,county,work_type,category,description,application_url,verified,created_at"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!jobs || jobs.length === 0) {
        message.textContent =
          "No published jobs are available yet.";
        return;
      }

      message.textContent =
        `${jobs.length} published job${jobs.length === 1 ? "" : "s"} found.`;

      jobs.forEach((job) => {
        const card = document.createElement("article");
        card.className = "job-card";

        const title = document.createElement("h3");
        title.textContent = job.title || "Untitled job";

        const company = document.createElement("p");
        company.textContent =
          `${job.company_name || "Employer not specified"} · ${job.county || "Kenya"}`;

        const details = document.createElement("p");
        details.textContent =
          `${job.work_type || "Not specified"} · ${job.category || "General"}`;

        const description = document.createElement("p");
        description.textContent = job.description || "";

        const verification = document.createElement("p");
        verification.textContent = job.verified
          ? "Verified listing"
          : "Verification not confirmed by HUSTLEHUB.";

        card.append(title, company, details, description, verification);

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
            // Do not display invalid application links.
          }
        }

        list.appendChild(card);
      });
    } catch (error) {
      console.error("HUSTLEHUB jobs error:", error);
      message.textContent =
        "We couldn't load jobs. Please refresh and try again.";
    }
  }

  // CHECK ADMIN ACCESS

  async function checkHustleHubAdmin() {
    const message = document.getElementById("adminMessage");
    const panel = document.getElementById("adminPanel");

    if (!message || !panel) return;

    panel.hidden = true;
    message.textContent = "Checking administrator access...";

    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      const user = data.session?.user;

      if (!user) {
        message.textContent =
          "Log in with your authorized administrator account to access the dashboard.";
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        message.textContent = "No profile found for this account.";
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
        "Admin check error: " + (error.message || String(error));
    }
  }

  // VERIFY ADMIN BEFORE WRITING

  async function verifyAdmin() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;

    const user = data.session?.user;
    if (!user) throw new Error("Please log in again.");

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile?.role !== "admin") {
      throw new Error("Administrator access required.");
    }

    return user;
  }

  // ADD A JOB

  async function addHustleHubJob(event) {
    event.preventDefault();

    const form = document.getElementById("adminJobForm");
    const message = document.getElementById("adminMessage");

    if (!form || !message) return;

    const button = form.querySelector('button[type="submit"]');

    try {
      await verifyAdmin();

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
            throw new Error("Invalid link");
          }
        } catch {
          message.textContent =
            "Enter a valid application link starting with https:// or http://.";
          return;
        }
      }

      if (button) button.disabled = true;
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

      message.textContent = status === "published"
        ? "Job published successfully!"
        : "Job saved as a draft successfully!";

      form.reset();
      await loadJobs();
      await loadAdminJobs();
    } catch (error) {
      console.error("HUSTLEHUB save-job error:", error);
      message.textContent =
        "Could not save job: " + (error.message || "Please try again.");
    } finally {
      if (button) button.disabled = false;
    }
  }

  // REGISTRATION

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
        showAuthMessage("Password must contain at least 8 characters.", true);
        return;
      }

      setButtonLoading(signupForm, true, "Creating account...");
      showAuthMessage("Connecting securely to HUSTLEHUB...");

      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: SITE_URL
          }
        });

        if (error) throw error;

        if (data.user && !data.session) {
          showAuthMessage(
            "Registration received! Check your email for a confirmation link."
          );
        } else if (data.session?.user) {
          updateAccountUI(data.session.user);
          showAuthMessage("Your HUSTLEHUB account is ready.");
        } else {
          showAuthMessage("Account created. You can now log in.");
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

  // LOGIN

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

        updateAccountUI(data.user);
        showAuthMessage("Login successful! Welcome to HUSTLEHUB.");

        loginForm.reset();
        await checkHustleHubAdmin();
        await loadAdminJobs();
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

  // LOG OUT

  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      showAuthMessage("Logging out...");

      try {
        const { error } = await client.auth.signOut();
        if (error) throw error;

        updateAccountUI(null);
        showAuthMessage("You have logged out successfully.");
        await checkHustleHubAdmin();
        await loadAdminJobs();
      } catch (error) {
        showAuthMessage(
          error.message || "Logout failed. Please try again.",
          true
        );
      } finally {
        logoutButton.disabled = false;
      }
    });
  }

  // LOAD ADMIN JOBS

  async function loadAdminJobs() {
    const list = document.getElementById("adminJobsList");
    const message = document.getElementById("adminJobsMessage");

    if (!list || !message) return;

    list.replaceChildren();
    message.textContent = "";

    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      if (!data.session?.user) {
        message.textContent = "Log in as an administrator to manage jobs.";
        return;
      }

      await verifyAdmin();

      const { data: jobs, error: jobsError } = await client
        .from("jobs")
        .select(
          "id,title,company_name,county,work_type,category,description,application_url,status,created_at"
        )
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobs || jobs.length === 0) {
        message.textContent = "No job listings found.";
        return;
      }

      jobs.forEach((job) => {
        const card = document.createElement("article");
        card.className = "job-card";

        const heading = document.createElement("h4");
        heading.textContent = job.title;

        const details = document.createElement("p");
        details.textContent =
          `${job.company_name} · ${job.county || "Kenya"} · ${job.work_type || "Not specified"}`;

        const status = document.createElement("p");
        status.textContent = "Status: " + job.status;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent =
          job.status === "published" ? "Unpublish" : "Publish";

        toggle.addEventListener("click", async () => {
          const nextStatus =
            job.status === "published" ? "draft" : "published";

          if (!confirm("Change this job to " + nextStatus + "?")) return;

          toggle.disabled = true;
          message.textContent = "Updating job...";

          try {
            await verifyAdmin();

            const { error } = await client
              .from("jobs")
              .update({ status: nextStatus })
              .eq("id", job.id);

            if (error) throw error;

            message.textContent = "Job status updated.";
            await loadAdminJobs();
            await loadJobs();
          } catch (error) {
            message.textContent =
              "Update failed: " + (error.message || "Please try again.");
            toggle.disabled = false;
          }
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete";

        remove.addEventListener("click", async () => {
          if (!confirm("Permanently delete this job listing?")) return;

          remove.disabled = true;
          message.textContent = "Deleting job...";

          try {
            await verifyAdmin();

            const { error } = await client
              .from("jobs")
              .delete()
              .eq("id", job.id);

            if (error) throw error;

            message.textContent = "Job deleted.";
            await loadAdminJobs();
            await loadJobs();
          } catch (error) {
            message.textContent =
              "Delete failed: " + (error.message || "Please try again.");
            remove.disabled = false;
          }
        });

        card.append(heading, details, status, toggle, remove);
        list.appendChild(card);
      });
    } catch (error) {
      console.error("HUSTLEHUB admin jobs error:", error);
      message.textContent =
        "Could not load admin jobs: " + (error.message || "Please try again.");
    }
  }

  // INITIALIZE

  async function initializeHustleHub() {
    const adminForm = document.getElementById("adminJobForm");

    if (adminForm) {
      adminForm.addEventListener("submit", addHustleHubJob);
    }

    await loadJobs();

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.error("HUSTLEHUB session error:", error);
      showAuthMessage("Could not check your session. Refresh and try again.", true);
      return;
    }

    updateAccountUI(data.session?.user || null);
    await checkHustleHubAdmin();
    await loadAdminJobs();

    if (data.session?.user) {
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

  client.auth.onAuthStateChange((event, session) => {
    if (
      event === "SIGNED_IN" ||
      event === "SIGNED_OUT" ||
      event === "TOKEN_REFRESHED"
    ) {
      setTimeout(() => {
        updateAccountUI(session?.user || null);
        checkHustleHubAdmin();
        loadAdminJobs();
      }, 0);
    }
  });
})();
