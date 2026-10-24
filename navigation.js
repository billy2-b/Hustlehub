
/*
 * HUSTLEHUB
 * Bottom navigation: Home, Wallet, Jobs, Support
 */

(() => {
  "use strict";

  const navigation = document.getElementById("bottomNavigation");
  const memberArea = document.getElementById("memberArea");

  if (!navigation || !memberArea) return;

  const buttons = navigation.querySelectorAll(".nav-item");

  const panels = {
    homeDashboard: document.getElementById("homeDashboard"),
    walletSection: document.getElementById("walletSection"),
    jobs: document.getElementById("jobs"),
    supportSection: document.getElementById("supportSection")
  };

  function updateNavigationVisibility() {
    navigation.hidden = memberArea.hidden;
  }

  function showPanel(targetId) {
    const target = panels[targetId];
    if (!target) return;

    Object.entries(panels).forEach(([id, panel]) => {
      if (panel) {
        panel.hidden = id !== targetId;
      }
    });

    buttons.forEach(button => {
      const active = button.dataset.target === targetId;
      button.classList.toggle("active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      showPanel(button.dataset.target);
    });
  });

  const observer = new MutationObserver(updateNavigationVisibility);
  observer.observe(memberArea, {
    attributes: true,
    attributeFilter: ["hidden"]
  });

  updateNavigationVisibility();

  if (panels.homeDashboard) {
    showPanel("homeDashboard");
  }
})();
