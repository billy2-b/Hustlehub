
/*
 * HUSTLEHUB
 * Registration, login, member-only jobs and verified admin dashboard
 */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

  // Keep your existing Supabase publishable key here.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YdkCAt_7EHlSOB7MDgZ0Rg_EJ89I0NJ";

  const SITE_URL =
    "https://billy2-b.github.io/Hustlehub/";

  const $ = (id) => document.getElementById(id);

  let client = null;
  let currentUser = null;
  let isVerifiedAdmin = false;

  function showAuthMessage(message, isError = false) {
    const element = $("authMessage");
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? "#b42318" : "#176b37";
  }

  function setButtonLoading(form, loading, text) {
    const button = form?.querySelector('button[type="submit"]');
    if (!button) return;

    if (loading) {
      button.dataset.originalText ||= button.textContent;
      button.disabled = true;
      button.textContent = text;
    } else {
      button.disabled = false;
      button.textContent =
        button.dataset.originalText || button.textContent;
    }
  }

  function updateAccountUI(user) {
    currentUser = user || null;
    isVerifiedAdmin = false;

    if ($("authForms")) $("authForms").hidden = Boolean(user);
    if ($("signedInPanel")) $("signedInPanel").hidden = !user;
    if ($("memberArea")) $("memberArea").hidden = !user;
    if ($("adminSection")) $("adminSection").hidden = true;
    if ($("adminPanel")) $("adminPanel").hidden = true;

    if (user && $("signedInMessage")) {
      $("signedInMessage").textContent =
        "Signed in as " + (user.email || "HUSTLEHUB user") + ".";
    }

    if (!user) {
      if ($("jobsList")) $("jobsList").replaceChildren();
      if ($("jobsMessage")) $("jobsMessage").textContent = "";
      if ($("adminJobsList")) $("adminJobsList").replaceChildren();
      if ($("adminJobsMessage")) $("adminJobsMessage").textContent = "";
    }
  }

  async function verifyAdmin() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;

    const user = data.user;
    if (!user || !currentUser || user.id !== currentUser.id) {
      throw new Error("Please sign in again.");
    }

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

  async function checkAdmin() {
    isVerifiedAdmin = false;
    if ($("adminSection")) $("adminSection").hidden = true;
    if ($("adminPanel")) $("adminPanel").hidden = true;

    if (!currentUser) return;

    try {
      await verifyAdmin();
      if (!currentUser) return;

      isVerifiedAdmin = true;
      if ($("adminSection")) $("adminSection").hidden = false;
      if ($("adminPanel")) $("adminPanel").hidden = false;
      if ($("adminMessage")) {
        $("adminMessage").textContent =
          "Administrator verified. You can manage job listings.";
      }
      await loadAdminJobs();
    } catch (error) {
      console.info("Admin dashboard not shown:", error.message);
      if ($("adminMessage")) $("adminMessage").textContent = "";
    }
  }

  async function loadJobs() {
    const list = $("jobsList");
    const message = $("jobsMessage");
    if (!list || !message) return;

    list.replaceChildren();

    if (!currentUser) {
      message.textContent = "";
      return;
    }

    message.textContent = "Loading available jobs...";

    try {
      const { data: jobs, error } = await client
        .from("jobs")
        .select(
          "id,title,company_name,county,work_type,category,description,application_url,verified,created_at"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!currentUser) return;

      if (!jobs?.length) {
        message.textContent = "No published jobs are available yet.";
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
      console.error("Jobs loading error:", error);
      message.textContent =
        "We couldn't load jobs. Please refresh and try again.";
    }
  }

  async function loadAdminJobs() {
    const list = $("adminJobsList");
    const message = $("adminJobsMessage");
    if (!list || !message) return;

    list.replaceChildren();
    message.textContent = "";

    if (!currentUser || !isVerifiedAdmin) return;

    try {
      await verifyAdmin();

      const { data: jobs, error } = await client
        .from("jobs")
        .select("id,title,company_name,county,work_type,status,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!currentUser || !isVerifiedAdmin) return;

      if (!jobs?.length) {
        message.textContent = "No job listings found.";
        return;
      }

      jobs.forEach((job) => {
        const card = document.createElement("article");
        card.className = "job-card";

        const title = document.createElement("h3");
        title.textContent = job.title || "Untitled job";

        const details = document.createElement("p");
        details.textContent =
          `${job.company_name || "Employer not specified"} · ${job.county || "Kenya"} · ${job.work_type || "Not specified"}`;

        const status = document.createElement("p");
        status.textContent = "Status: " + job.status;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent =
          job.status === "published" ? "Unpublish" : "Publish";

        toggle.addEventListener("click", async () => {
          toggle.disabled = true;
          try {
            await verifyAdmin();
            const nextStatus =
              job.status === "published" ? "draft" : "published";

            const { error } = await client
              .from("jobs")
              .update({ status: nextStatus })
              .eq("id", job.id);

            if (error) throw error;
            await loadJobs();
            await loadAdminJobs();
          } catch (error) {
            message.textContent = "Update failed: " + error.message;
          } finally {
            toggle.disabled = false;
          }
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete";

        remove.addEventListener("click", async () => {
          if (!confirm("Permanently delete this job listing?")) return;

          remove.disabled = true;
          try {
            await verifyAdmin();
            const { error } = await client
              .from("jobs")
              .delete()
              .eq("id", job.id);

            if (error) throw error;
            await loadJobs();
            await loadAdminJobs();
          } catch (error) {
            message.textContent = "Delete failed: " + error.message;
          } finally {
            remove.disabled = false;
          }
        });

        card.append(title, details, status, toggle, remove);
        list.appendChild(card);
      });
    } catch (error) {
      console.error("Admin jobs loading error:", error);
      message.textContent = "Could not load admin jobs: " + error.message;
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    const form = $("signupForm");
    const fullName = $("signupName")?.value.trim();
    const email = $("signupEmail")?.value.trim();
    const password = $("signupPassword")?.value;

    if (!fullName || !email || !password) {
      showAuthMessage("Please fill in all registration fields.", true);
      return;
    }

    setButtonLoading(form, true, "Creating account...");
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

      if (data.session?.user) {
        updateAccountUI(data.session.user);
        await loadJobs();
        await checkAdmin();
        showAuthMessage("Your HUSTLEHUB account is ready.");
      } else {
        showAuthMessage(
          "Registration received! Check your email for a confirmation link."
        );
      }
      form.reset();
    } catch (error) {
      showAuthMessage(error.message || "Registration failed.", true);
    } finally {
      setButtonLoading(form, false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = $("loginForm");
    const email = $("loginEmail")?.value.trim();
    const password = $("loginPassword")?.value;

    if (!email || !password) {
      showAuthMessage("Please enter your email and password.", true);
      return;
    }

    setButtonLoading(form, true, "Logging in...");
    showAuthMessage("Signing in to HUSTLEHUB...");

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      updateAccountUI(data.user);
      await loadJobs();
      await checkAdmin();
      showAuthMessage("Login successful! Welcome to HUSTLEHUB.");
      form.reset();
    } catch (error) {
      showAuthMessage(error.message || "Login failed.", true);
    } finally {
      setButtonLoading(form, false);
    }
  }

  async function handleLogout() {
    const button = $("logoutButton");
    if (button) button.disabled = true;

    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;

      updateAccountUI(null);
      showAuthMessage("You have logged out successfully.");
    } catch (error) {
      showAuthMessage(error.message || "Logout failed.", true);
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleSaveJob(event) {
    event.preventDefault();
    const form = $("adminJobForm");
    const message = $("adminMessage");

    try {
      await verifyAdmin();
      if (!isVerifiedAdmin) {
        throw new Error("Administrator access has not been verified.");
      }

      const title = $("adminJobTitle").value.trim();
      const company = $("adminCompany").value.trim();
      const description = $("adminDescription").value.trim();
      const applicationUrl = $("adminApplicationUrl").value.trim();

      if (!title || !company || !description) {
        throw new Error("Please complete the required job details.");
      }

      if (applicationUrl) {
        const url = new URL(applicationUrl);
        if (!["https:", "http:"].includes(url.protocol)) {
          throw new Error("Use a valid http:// or https:// application link.");
        }
      }

      const status = $("adminJobStatus").value;
      if (!["draft", "published"].includes(status)) {
        throw new Error("Invalid listing status.");
      }

      const { error } = await client.from("jobs").insert({
        title,
        company_name: company,
        county: $("adminCounty").value.trim() || "Kenya",
        work_type: $("adminWorkType").value,
        category: $("adminCategory").value.trim() || "General",
        description,
        application_url: applicationUrl || null,
        status
      });

      if (error) throw error;

      message.textContent =
        status === "published" ? "Job published successfully!" : "Job saved as draft.";
      form.reset();
      await loadJobs();
      await loadAdminJobs();
    } catch (error) {
      message.textContent = "Could not save job: " + error.message;
    }
  }

  async function initialize() {
    if (
      !window.supabase ||
      !SUPABASE_PUBLISHABLE_KEY ||
      SUPABASE_PUBLISHABLE_KEY ===
        "PASTE_YOUR_EXISTING_SUPABASE_PUBLISHABLE_KEY_HERE"
    ) {
      showAuthMessage(
        "Supabase setup is incomplete. Add your existing publishable key in app.js.",
        true
      );
      return;
    }

    client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    window.hustlehubSupabase = client;

    $("signupForm")?.addEventListener("submit", handleSignup);
    $("loginForm")?.addEventListener("submit", handleLogin);
    $("logoutButton")?.addEventListener("click", handleLogout);
    $("adminJobForm")?.addEventListener("submit", handleSaveJob);

    updateAccountUI(null);

    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      const user = data.session?.user || null;
      updateAccountUI(user);

      if (user) {
        await loadJobs();
        await checkAdmin();
      }
    } catch (error) {
      console.error("Session check failed:", error);
      showAuthMessage("Could not check your session. Please refresh.", true);
    }

    client.auth.onAuthStateChange((event, session) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        setTimeout(async () => {
          updateAccountUI(session?.user || null);

          if (session?.user) {
            await loadJobs();
            await checkAdmin();
          }
        }, 0);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
