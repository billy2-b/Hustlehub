
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
/* HUSTLEHUB ADMIN FEATURE */

async function checkHustleHubAdmin() {
  const message = document.getElementById("adminMessage");
  const panel = document.getElementById("adminPanel");

  if (!message || !panel) {
    console.log("HUSTLEHUB admin panel is not added to index.html yet.");
    return;
  }

  panel.hidden = true;
  message.textContent = "Checking administrator access...";

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) throw sessionError;

    const user = sessionData.session?.user;

    if (!user) {
      message.textContent = "Please log in first.";
      return;
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile || profile.role !== "admin") {
      message.textContent =
        "Access denied. Only authorized administrators can manage jobs.";
      return;
    }

    message.textContent = "Administrator verified. You can manage jobs.";
    panel.hidden = false;
  } catch (error) {
    console.error("Admin check failed:", error);
    message.textContent =
      "Could not verify admin access. Please refresh and try again.";
  }
}

async function addHustleHubJob(event) {
  event.preventDefault();

  const message = document.getElementById("adminMessage");
  const form = document.getElementById("adminJobForm");

  if (!form || !message) return;

  const title = document.getElementById("adminJobTitle").value.trim();
  const company = document.getElementById("adminCompany").value.trim();
  const county = document.getElementById("adminCounty").value.trim();
  const workType = document.getElementById("adminWorkType").value;
  const category = document.getElementById("adminCategory").value.trim();
  const description =
    document.getElementById("adminDescription").value.trim();
  const applicationUrl =
    document.getElementById("adminApplicationUrl").value.trim();
  const status = document.getElementById("adminJobStatus").value;

  if (!title || !company || !description) {
    message.textContent = "Please complete the required job details.";
    return;
  }

  if (applicationUrl) {
    try {
      const url = new URL(applicationUrl);
      if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      message.textContent =
        "Enter a valid application link beginning with https:// or http://.";
      return;
    }
  }

  message.textContent = "Saving job...";

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session?.user) {
      message.textContent = "Please log in again.";
      return;
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", sessionData.session.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile?.role !== "admin") {
      message.textContent = "Access denied.";
      return;
    }

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

    message.textContent = "Job saved successfully!";
    form.reset();

    if (typeof loadJobs === "function") {
      await loadJobs();
    }
  } catch (error) {
    console.error("Saving job failed:", error);
    message.textContent =
      "Could not save the job. Check the database permissions and try again.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminJobForm");

  if (form) {
    form.addEventListener("submit", addHustleHubJob);
  }

  checkHustleHubAdmin();
});

