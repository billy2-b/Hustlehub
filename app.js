
/*
 * HUSTLEHUB
 * Registration, login, member-only jobs,
 * verified admin dashboard and read-only wallet
 */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://osumagzwxvyaepycksin.supabase.co";

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

  function money(value) {
    return "KSh " + Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function clearWalletUI() {
    if ($("walletBalance")) $("walletBalance").textContent = "KSh 0.00";
    if ($("walletRewards")) $("walletRewards").textContent = "KSh 0.00";
    if ($("walletPending")) $("walletPending").textContent = "KSh 0.00";
    if ($("walletMinimum")) $("walletMinimum").textContent = "KSh 100.00";

    if ($("walletMessage")) {
      $("walletMessage").textContent = "Sign in to view your wallet.";
    }

    if ($("walletHistoryMessage")) {
      $("walletHistoryMessage").textContent =
        "Sign in to view your transaction history.";
    }

    if ($("walletTransactionsList")) {
      $("walletTransactionsList").replaceChildren();
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

      clearWalletUI();
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

    const requestedUserId = currentUser.id;
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

      if (!currentUser || currentUser.id !== requestedUserId) return;

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
            // Ignore invalid application links.
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

  async function loadWallet(user) {
    const balanceEl = $("walletBalance");
    const rewardsEl = $("walletRewards");
    const pendingEl = $("walletPending");
    const minimumEl = $("walletMinimum");
    const messageEl = $("walletMessage");
    const historyMessageEl = $("walletHistoryMessage");
    const historyList = $("walletTransactionsList");

    if (!user || !client) return;

    const requestedUserId = user.id;

    if (messageEl) messageEl.textContent = "Loading wallet...";
    if (historyMessageEl) {
      historyMessageEl.textContent = "Loading transaction history...";
    }

    try {
      const { data: wallet, error: walletError } = await client
        .from("wallets")
        .select("balance_kes")
        .eq("user_id", requestedUserId)
        .maybeSingle();

      if (walletError) throw walletError;

      const { data: transactions, error: transactionError } = await client
        .from("wallet_transactions")
        .select(
          "transaction_type,amount_kes,status,description,created_at"
        )
        .eq("user_id", requestedUserId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (transactionError) throw transactionError;

      const { data: settings, error: settingsError } = await client
        .from("wallet_settings")
        .select("minimum_withdrawal_kes")
        .eq("id", 1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (!currentUser || currentUser.id !== requestedUserId) return;

      const rows = transactions || [];

      if (balanceEl) {
        balanceEl.textContent = money(wallet?.balance_kes);
      }

      const rewards = rows
        .filter((row) =>
          row.transaction_type === "referral_reward" &&
          row.status === "completed"
        )
        .reduce((sum, row) => sum + Number(row.amount_kes || 0), 0);

      const pending = rows
        .filter((row) => row.status === "pending")
        .reduce((sum, row) => sum + Number(row.amount_kes || 0), 0);

      if (rewardsEl) rewardsEl.textContent = money(rewards);
      if (pendingEl) pendingEl.textContent = money(pending);

      if (minimumEl) {
        minimumEl.textContent = money(
          settings?.minimum_withdrawal_kes ?? 100
        );
      }

      // FIX: update the history message from the HTML.
      if (historyMessageEl) {
        historyMessageEl.textContent = rows.length
          ? `${rows.length} transaction(s) found.`
          : "No wallet transactions yet.";
      }

      if (historyList) {
        historyList.replaceChildren();

        if (!rows.length) {
          const empty = document.createElement("p");
          empty.textContent = "No wallet transactions yet.";
          historyList.appendChild(empty);
        } else {
          rows.forEach((row) => {
            const item = document.createElement("article");
            item.className = "transaction-item";

            const description = document.createElement("p");
            description.textContent =
              row.description ||
              String(row.transaction_type || "Transaction")
                .replaceAll("_", " ");

            const amount = document.createElement("p");
            amount.textContent =
              money(row.amount_kes) + " · " + row.status;

            const date = document.createElement("p");
            date.textContent = row.created_at
              ? new Date(row.created_at).toLocaleString("en-KE")
              : "";

            item.append(description, amount, date);
            historyList.appendChild(item);
          });
        }
      }

      if (messageEl) {
        messageEl.textContent = wallet
          ? "Wallet information updated."
          : "No wallet record found. Please contact support.";
      }
    } catch (error) {
      console.error("Wallet loading failed:", error);

      if (messageEl) {
        messageEl.textContent =
          "Could not load wallet information. Please refresh and try again.";
      }

      if (historyMessageEl) {
        historyMessageEl.textContent =
          "Could not load transaction history. Please refresh and try again.";
      }
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
        await loadWallet(data.session.user);
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
      await loadWallet(data.user);

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
        status === "published"
          ? "Job published successfully!"
          : "Job saved as draft.";

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
        "Supabase setup is incomplete. Check app.js configuration.",
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
        await loadWallet(user);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      showAuthMessage(
        "Could not check your session. Please refresh.",
        true
      );
    }

    client.auth.onAuthStateChange((event, session) => {
      if (
        event === "SIGNED_