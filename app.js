
/*
 * HUSTLEHUB
 * PART 1 OF 2
 * Supabase setup, authentication, and shared helpers
 */

(() => {
  "use strict";

  // ==========================================
  // 1. SUPABASE CONFIGURATION
  // ==========================================

  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

  // Replace this placeholder with your EXISTING
  // public Supabase publishable/anon key.
  // NEVER put your service-role key here.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YdkCAt_7EHlSOB7MDgZ0Rg_EJ89I0NJ";

  const SITE_URL =
    "https://billy2-b.github.io/Hustlehub/";

  // ==========================================
  // 2. CHECK PAGE AND SUPABASE CONNECTION
  // ==========================================

  const $ = (id) => document.getElementById(id);

  const setHidden = (id, hidden) => {
    const element = $(id);
    if (element) {
      element.hidden = hidden;
    }
  };

  const setText = (id, message) => {
    const element = $(id);
    if (element) {
      element.textContent = message;
    }
  };

  const showMessage = (id, message, isError = false) => {
    const element = $(id);
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#b42318" : "#167447";
  };

  const formatKES = (amount) => {
    const number = Number(amount || 0);

    return "KSh " + number.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const escapeHTML = (value) => {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  };

  const isValidKenyanPhone = (phone) => {
    return /^(07|01)\d{8}$/.test(
      String(phone || "").replace(/\s+/g, "")
    );
  };

  // ==========================================
  // 3. VERIFY SUPABASE IS AVAILABLE
  // ==========================================

  if (!window.supabase || !window.supabase.createClient) {
    console.error("HUSTLEHUB: Supabase library was not loaded.");

    showMessage(
      "authMessage",
      "Connection error. Refresh the page and try again.",
      true
    );

    return;
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR")
  ) {
    showMessage(
      "authMessage",
      "Setup required: add your existing public Supabase key to app.js.",
      true
    );

    console.error(
      "HUSTLEHUB: Add the public Supabase publishable/anon key."
    );

    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  // Shared account information used by Part 2.
  let currentUser = null;
  let currentProfile = null;

  // ==========================================
  // 4. SHOW THE LOGGED-OUT SCREEN
  // ==========================================

  function showLoggedOut() {
    currentUser = null;
    currentProfile = null;

    setHidden("accountSection", false);
    setHidden("authForms", false);
    setHidden("memberArea", true);
    setHidden("signedInPanel", true);
    setHidden("adminSection", true);

    // Hide member-only pages when logged out.
    setHidden("walletSection", true);
    setHidden("jobs", true);
    setHidden("supportSection", true);

    showMessage("authMessage", "");
  }

  // ==========================================
  // 5. LOAD THE SIGNED-IN USER'S PROFILE
  // Part 2 will finish entering the member area.
  // ==========================================

  async function enterMemberArea(user) {
    currentUser = user;

    showMessage("authMessage", "Loading your HUSTLEHUB account...");

    const { data: profile, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile loading error:", error);

      showMessage(
        "authMessage",
        "We could not load your profile. Please refresh and try again.",
        true
      );

      return;
    }

    if (!profile) {
      showMessage(
        "authMessage",
        "Your profile was not found. Please contact support.",
        true
      );

      return;
    }

    currentProfile = profile;

    // Part 2 will complete the member interface,
    // load jobs and wallet information, and handle admin tools.
  }

  // ==========================================
  // 6. LOGIN FORM
  // ==========================================

  const loginForm = $("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = $("loginEmail")?.value.trim();
      const password = $("loginPassword")?.value;

      if (!email || !password) {
        showMessage(
          "authMessage",
          "Please enter your email and password.",
          true
        );

        return;
      }

      const loginButton = loginForm.querySelector(
        'button[type="submit"], button:not([type])'
      );

      if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
      }

      showMessage("authMessage", "Checking your login details...");

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Login could not be completed.");
        }

        await enterMemberArea(data.user);

      } catch (error) {
        console.error("Login error:", error);

        showMessage(
          "authMessage",
          error.message || "Login failed. Please try again.",
          true
        );

      } finally {
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = "Login";
        }
      }
    });
  }

  // ==========================================
  // 7. REGISTRATION FORM
  // ==========================================

  const signupForm = $("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const fullName = $("signupName")?.value.trim();
      const email = $("signupEmail")?.value.trim();
      const password = $("signupPassword")?.value;

      if (!fullName || !email || !password) {
        showMessage(
          "authMessage",
          "Please fill in all registration fields.",
          true
        );

        return;
      }

      if (password.length < 6) {
        showMessage(
          "authMessage",
          "Your password must contain at least 6 characters.",
          true
        );

        return;
      }

      const signupButton = signupForm.querySelector(
        'button[type="submit"], button:not([type])'
      );

      if (signupButton) {
        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";
      }

      showMessage("authMessage", "Creating your account...");

      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
  data: {
    full_name: fullName,
    referral_code: (
      $("signupReferralCode")?.value || ""
    ).trim().toUpperCase()
  },
  emailRedirectTo: SITE_URL
}
        });

        if (error) throw error;

        if (data.session && data.user) {
          await enterMemberArea(data.user);
        } else {
          showMessage(
            "authMessage",
            "Registration successful! Check your email to confirm your account."
          );
        }

      } catch (error) {
        console.error("Registration error:", error);

        showMessage(
          "authMessage",
          error.message || "Registration failed. Please try again.",
          true
        );

      } finally {
        if (signupButton) {
          signupButton.disabled = false;
          signupButton.textContent = "Register";
        }
      }
    });
  }

  // ==========================================
  // 8. LOGOUT BUTTON
  // ==========================================

  const logoutButton = $("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;

      try {
        const { error } = await client.auth.signOut();

        if (error) throw error;

        showLoggedOut();

      } catch (error) {
        console.error("Logout error:", error);

        showMessage(
          "authMessage",
          "Logout failed. Please try again.",
          true
        );

      } finally {
        logoutButton.disabled = false;
      }
    });
  }

  // ==========================================
  // PART 2 CONTINUES BELOW THIS LINE.
  // Do not add the closing brackets yet.
  // ==========================================

  // ==========================================
  // 9. ENTER THE MEMBER AREA
  // ==========================================

  async function finishEnteringMemberArea(user) {
    await enterMemberArea(user);

    if (!currentProfile) return;

    setHidden("accountSection", true);
    setHidden("authForms", true);
    setHidden("memberArea", false);
    setHidden("homeDashboard", false);
    setHidden("signedInPanel", false);

    const name =
      currentProfile.full_name ||
      user.user_metadata?.full_name ||
      user.email ||
      "Member";

    
    setText("homeGreeting", "HELLO, " + name);
    setText("signedInMessage", "Welcome to HUSTLEHUB, " + name + ".");

  
    // ==========================================
    // ACCOUNT ACTIVATION PANEL
    // JOB SEEKERS ONLY
    // ==========================================

    const homeDashboard = $("homeDashboard");
    let activationPanel = $("hustlehubActivationPanel");

    if (currentProfile.role !== "admin") {
      if (homeDashboard) {
        if (!activationPanel) {
          activationPanel = document.createElement("section");
          activationPanel.id = "hustlehubActivationPanel";
          activationPanel.className = "activation-card";

          const greeting = $("homeGreeting");

          if (greeting && greeting.parentElement) {
            greeting.insertAdjacentElement(
              "afterend",
              activationPanel
            );
          } else {
            homeDashboard.prepend(activationPanel);
          }
        }

        activationPanel.replaceChildren();

        const activationTitle = document.createElement("h3");
        const activationStatus = document.createElement("p");
        const activationDetails = document.createElement("p");

        if (currentProfile.is_activated === true) {
          activationTitle.textContent = "Account Activated";

          activationStatus.textContent =
            "Your HUSTLEHUB account is active.";

          activationDetails.textContent =
            "You can continue using your account.";

          activationPanel.append(
            activationTitle,
            activationStatus,
            activationDetails
          );

        } else {
          activationTitle.textContent = "Account Not Activated";

          activationStatus.textContent =
            "Your account is currently awaiting activation.";

          activationDetails.textContent =
            "Account activation is not connected to payment yet. " +
            "No payment is required through this button.";

          const activateButton = document.createElement("button");
          activateButton.type = "button";
          activateButton.textContent = "Activate Account";

          activateButton.addEventListener("click", () => {
            activationDetails.textContent =
              "Activation payments are not enabled yet. " +
              "No payment has been requested. " +
              "Please check back when activation is available.";
          });

          activationPanel.append(
            activationTitle,
            activationStatus,
            activationDetails,
            activateButton
          );
        }
      }

    } else {
      // Remove the activation panel from the admin dashboard.
      if (activationPanel) {
        activationPanel.remove();
      }
    }


    const isAdmin = currentProfile.role === "admin";


    setHidden("adminSection", !isAdmin);

    if (isAdmin) {
      showMessage("adminMessage", "Administrator verified. You can manage jobs.");
    }

    await loadJobs();
    await loadWallet();

    showPage("homeDashboard");
  }

  // ==========================================
  // 10. PAGE NAVIGATION
  // ==========================================

  function showPage(targetId) {
    const memberPages = [
      "homeDashboard",
      "walletSection",
      "jobs",
      "supportSection"
    ];

    memberPages.forEach((id) => {
      setHidden(id, id !== targetId);
    });

    document.querySelectorAll(".nav-item").forEach((button) => {
      const active = button.dataset.target === targetId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      if (!currentUser) return;

      const target = button.dataset.target;

      if (target) showPage(target);
    });
  });

  document.querySelectorAll(".dashboard-nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (!currentUser) return;

      const target = button.dataset.target;

      if (target) showPage(target);
    });
  });

  // ==========================================
  // 11. LOAD PUBLISHED JOBS
  // ==========================================

  async function loadJobs() {
    const list = $("jobsList");

    if (!list) return;

    list.textContent = "Loading opportunities...";

    let query = client
      .from("jobs")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const { data: jobs, error } = await query;

    if (error) {
      console.error("Jobs loading error:", error);
      list.textContent = "Unable to load jobs. Please try again later.";
      return;
    }

    list.replaceChildren();

    if (!jobs || jobs.length === 0) {
      list.textContent = "No published opportunities available right now.";
      return;
    }

    jobs.forEach((job) => {
      const card = document.createElement("article");
      card.className = "job-card";

      const title = document.createElement("h3");
      title.textContent = job.title || "Opportunity";

      const company = document.createElement("p");
      company.textContent = "Company: " + (job.company_name || "Not specified");

      const details = document.createElement("p");
      details.textContent =
        "County: " + (job.county || "Kenya") +
        " · Work type: " + (job.work_type || "Not specified");

      const category = document.createElement("p");
      category.textContent = "Category: " + (job.category || "General");

      const description = document.createElement("p");
      description.textContent = job.description || "";

      card.append(title, company, details, category, description);

      if (job.verified) {
        const verified = document.createElement("p");
        verified.textContent = "✓ Verified listing";
        card.appendChild(verified);
      }

      if (job.application_url) {
        try {
          const url = new URL(job.application_url);

          if (url.protocol === "https:" || url.protocol === "http:") {
            const link = document.createElement("a");
            link.href = url.href;
            link.textContent = "View application";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            card.appendChild(link);
          }
        } catch {
          // Do not create a link if the URL is invalid.
        }
      }

      list.appendChild(card);
    });

    showMessage("jobsMessage", jobs.length + " published opportunity/opportunities loaded.");
  }

  // ==========================================
  // 12. ADMIN JOB CREATION
  // ==========================================

  const adminJobForm = $("adminJobForm");

  if (adminJobForm) {
    adminJobForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!currentUser || currentProfile?.role !== "admin") {
        showMessage("adminJobsMessage", "Admin access required.", true);
        return;
      }

      const title = $("adminJobTitle")?.value.trim();
      const company = $("adminCompany")?.value.trim();

      if (!title || !company) {
        showMessage("adminJobsMessage", "Enter the job title and company.", true);
        return;
      }

      const status = $("adminJobStatus")?.value || "draft";

      const newJob = {
        title,
        company_name: company,
        county: $("adminCounty")?.value.trim() || "Kenya",
        work_type: $("adminWorkType")?.value || "Full-time",
        category: $("adminCategory")?.value || "General",
        description: $("adminDescription")?.value.trim() || "",
        application_url: $("adminApplicationUrl")?.value.trim() || null,
        status: status === "published" ? "published" : "draft",
        verified: false
      };

      const submitButton = adminJobForm.querySelector(
        'button[type="submit"], button:not([type])'
      );

      if (submitButton) submitButton.disabled = true;

      showMessage("adminJobsMessage", "Saving opportunity...");

      try {
        const { error } = await client
          .from("jobs")
          .insert(newJob);

        if (error) throw error;

        showMessage("adminJobsMessage", "Opportunity saved successfully.");
        adminJobForm.reset();

        await loadJobs();
        await loadAdminJobs();

      } catch (error) {
        console.error("Job creation error:", error);

        showMessage(
          "adminJobsMessage",
          error.message || "Could not save the opportunity.",
          true
        );

      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  // ==========================================
  // 13. ADMIN JOB MANAGEMENT
  // ==========================================

  async function loadAdminJobs() {
    const list = $("adminJobsList");

    if (!list || currentProfile?.role !== "admin") return;

    list.textContent = "Loading job management...";

    const { data: jobs, error } = await client
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin jobs error:", error);
      list.textContent = "Unable to load admin jobs.";
      return;
    }

    list.replaceChildren();

    if (!jobs || jobs.length === 0) {
      list.textContent = "No jobs have been created yet.";
      return;
    }

    jobs.forEach((job) => {
      const card = document.createElement("article");
      card.className = "job-card";

      const title = document.createElement("h3");
      title.textContent = job.title || "Untitled job";

      const status = document.createElement("p");
      status.textContent = "Status: " + (job.status || "draft");

      const publishButton = document.createElement("button");
      publishButton.type = "button";
      publishButton.textContent =
        job.status === "published" ? "Unpublish" : "Publish";

      publishButton.addEventListener("click", async () => {
        if (currentProfile?.role !== "admin") return;

        publishButton.disabled = true;

        const nextStatus =
          job.status === "published" ? "draft" : "published";

        const { error: updateError } = await client
          .from("jobs")
          .update({ status: nextStatus })
          .eq("id", job.id);

        publishButton.disabled = false;

        if (updateError) {
          console.error("Job status update error:", updateError);
          showMessage("adminJobsMessage", "Could not update job status.", true);
          return;
        }

        showMessage("adminJobsMessage", "Job status updated.");
        await loadAdminJobs();
        await loadJobs();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", async () => {
        if (currentProfile?.role !== "admin") return;

        const confirmed = window.confirm(
          "Delete this job permanently?"
        );

        if (!confirmed) return;

        deleteButton.disabled = true;

        const { error: deleteError } = await client
          .from("jobs")
          .delete()
          .eq("id", job.id);

        deleteButton.disabled = false;

        if (deleteError) {
          console.error("Job deletion error:", deleteError);
          showMessage("adminJobsMessage", "Could not delete this job.", true);
          return;
        }

        showMessage("adminJobsMessage", "Job deleted.");
        await loadAdminJobs();
        await loadJobs();
      });

      card.append(title, status, publishButton, deleteButton);
      list.appendChild(card);
    });
  }

  // ==========================================
  // 14. LOAD WALLET INFORMATION
  // ==========================================

  async function loadWallet() {
    if (!currentUser) return;

    showMessage("walletMessage", "Loading wallet...");

    try {
      const { data: wallet, error: walletError } = await client
        .from("wallets")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (walletError) throw walletError;

      const balance =
        wallet?.balance_kes ??
        wallet?.balance ??
        0;

      setText("walletBalance", formatKES(balance));

      const { data: transactions, error: transactionError } = await client
        .from("wallet_transactions")
        .select("id,transaction_type,amount_kes,status,description,created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (transactionError) throw transactionError;

      const rows = transactions || [];

      const rewards = rows
        .filter((item) =>
          item.transaction_type === "referral_reward" &&
          item.status === "completed"
        )
        .reduce((sum, item) => sum + Number(item.amount_kes || 0), 0);

      const pending = rows
        .filter((item) => item.status === "pending")
        .reduce((sum, item) => sum + Number(item.amount_kes || 0), 0);

      setText("walletRewards", formatKES(rewards));
      setText("walletPending", formatKES(pending));

      const { data: settings, error: settingsError } = await client
        .from("wallet_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      const minimum =
        settings?.minimum_withdrawal_kes ??
        settings?.minimum_withdrawal ??
        settings?.min_withdrawal_kes ??
        100;

      setText("walletMinimum", formatKES(minimum));

      const history = $("walletTransactionsList");

      if (history) {
        history.replaceChildren();

        if (rows.length === 0) {
          history.textContent = "No wallet transactions yet.";
        } else {
          rows.forEach((item) => {
            const entry = document.createElement("article");
            entry.className = "transaction-item";

            const heading = document.createElement("strong");
            heading.textContent = (item.transaction_type || "Transaction")
              .replaceAll("_", " ");

            const amount = document.createElement("p");
            amount.textContent = formatKES(item.amount_kes);

            const state = document.createElement("p");
            state.textContent = "Status: " + (item.status || "unknown");

            const description = document.createElement("p");
            description.textContent = item.description || "";

            const date = document.createElement("small");
            date.textContent = item.created_at
              ? new Date(item.created_at).toLocaleString("en-KE")
              : "";

            entry.append(heading, amount, state, description, date);
            history.appendChild(entry);
          });
        }
      }

      showMessage("walletMessage", "Wallet information loaded.");

    } catch (error) {
      console.error("Wallet loading error:", error);

      showMessage(
        "walletMessage",
        "Wallet information could not be loaded. Check your wallet table columns and permissions.",
        true
      );
    }
  }

  // ==========================================
  // 15. SAFE PAYMENT PLACEHOLDERS
  // ==========================================

  const depositForm = $("walletDepositForm");

  if (depositForm) {
    depositForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!currentUser) {
        showMessage("depositMessage", "Please log in first.", true);
        return;
      }

      const amount = Number($("depositAmount")?.value);
      const phone = ($("depositPhone")?.value || "").replace(/\s+/g, "");

      if (!Number.isFinite(amount) || amount < 1) {
        showMessage("depositMessage", "Enter a valid deposit amount.", true);
        return;
      }

      if (!isValidKenyanPhone(phone)) {
        showMessage(
          "depositMessage",
          "Enter a valid Kenyan phone number starting with 07 or 01.",
          true
        );
        return;
      }

      showMessage(
        "depositMessage",
        "M-Pesa deposits are not enabled in this website version. No payment has been requested."
      );
    });
  }

  const withdrawForm = $("walletWithdrawForm");

  if (withdrawForm) {
    withdrawForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!currentUser) {
        showMessage("withdrawMessage", "Please log in first.", true);
        return;
      }

      const amount = Number($("withdrawAmount")?.value);
      const phone = ($("withdrawPhone")?.value || "").replace(/\s+/g, "");

      if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("withdrawMessage", "Enter a valid withdrawal amount.", true);
        return;
      }

      if (!isValidKenyanPhone(phone)) {
        showMessage(
          "withdrawMessage",
          "Enter a valid Kenyan phone number starting with 07 or 01.",
          true
        );
        return;
      }

      showMessage(
        "withdrawMessage",
        "Withdrawals are not enabled yet. No money has been sent."
      );
    });
  }

  // ==========================================
  // 16. STARTUP AND SESSION RESTORATION
  // ==========================================

  async function initializeApp() {
    showLoggedOut();

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.error("Session check error:", error);
      showMessage("authMessage", "Could not check your login. Refresh the page.", true);
      return;
    }

    if (data.session?.user) {
      await finishEnteringMemberArea(data.session.user);
    }

    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        showLoggedOut();
        return;
      }

      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        // Defer Supabase queries until after this auth callback returns.
        Promise.resolve().then(async () => {
          if (currentUser?.id === session.user.id && currentProfile) return;
          await finishEnteringMemberArea(session.user);
        });
      }
    });
  }

  initializeApp().catch((error) => {
    console.error("HUSTLEHUB startup error:", error);

    showMessage(
      "authMessage",
      "HUSTLEHUB could not start. Refresh the page and try again.",
      true
    );
  });

  // ==========================================
  // END OF HUSTLEHUB APP.JS
  // ==========================================
})();
