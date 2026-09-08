/* Smart Classroom - shared UI behaviour
   Handles: sidebar collapse/mobile nav, login role + profile persistence,
   topbar quick-search, table/card search & filters, settings persistence,
   "coming soon" placeholders, live dashboard date, and consistent active-nav state. */

const PROFILE_KEY = "smartClassroomProfile";
const SIDEBAR_KEY = "smartClassroomSidebarCollapsed";

const defaultProfile = {
  name: "Admin User",
  role: "Admin",
  department: "Administration"
};

function getProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (saved && saved.name) return { ...defaultProfile, ...saved };
  } catch (_) {}
  return { ...defaultProfile };
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/* ---------- Toast notifications ---------- */
function ensureToastHost() {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  return host;
}

function toast(message, type = "info") {
  const host = ensureToastHost();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

/* ---------- Sidebar collapse (desktop) / drawer (mobile) ---------- */
function initSidebarToggle() {
  const menuBtn = document.querySelector(".menu");
  const app = document.querySelector(".app");
  if (!menuBtn || !app) return;

  if (localStorage.getItem(SIDEBAR_KEY) === "1") {
    app.classList.add("sidebar-toggled");
  }

  menuBtn.setAttribute("role", "button");
  menuBtn.setAttribute("tabindex", "0");
  menuBtn.setAttribute("aria-label", "Toggle navigation");

  const toggle = () => {
    app.classList.toggle("sidebar-toggled");
    localStorage.setItem(SIDEBAR_KEY, app.classList.contains("sidebar-toggled") ? "1" : "0");
  };

  menuBtn.addEventListener("click", toggle);
  menuBtn.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  document.addEventListener("click", e => {
    if (window.innerWidth > 768) return;
    if (!app.classList.contains("sidebar-toggled")) return;
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && !sidebar.contains(e.target)) {
      app.classList.remove("sidebar-toggled");
      localStorage.setItem(SIDEBAR_KEY, "0");
    }
  });
}

/* ---------- Active nav + role-aware links + topbar profile ---------- */
function initNavAndProfile() {
  const profile = getProfile();
  const nav = document.querySelector(".nav");
  if (nav) {
    const timetableLink = nav.querySelector('a[href="timetable.html"], a[href="student-timetable.html"]');
    if (timetableLink) {
      timetableLink.setAttribute(
        "href",
        profile.role === "Student" ? "student-timetable.html" : "timetable.html"
      );
    }

    const here = location.pathname.split("/").pop() || "index.html";
    nav.querySelectorAll("a").forEach(a => {
      const target = a.getAttribute("href");
      a.classList.toggle("active", target === here);
    });
  }

  const nameEl = document.querySelector(".profile strong");
  const roleEl = document.querySelector(".profile small");
  if (nameEl) nameEl.textContent = profile.name;
  if (roleEl) {
    const roleLabel = profile.role === "Admin" ? "Administrator" : profile.role;
    roleEl.textContent = roleLabel;
  }

  const welcomeTitle = document.getElementById("welcomeTitle");
  if (welcomeTitle) {
    const firstName = profile.name.split(" ")[0];
    welcomeTitle.textContent = `Welcome back, ${firstName}! 👋`;
  }
}

/* ---------- Live dashboard date ---------- */
function initTodayDate() {
  const el = document.getElementById("todayDate");
  if (!el) return;
  const today = new Date();
  el.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/* ---------- Login form ---------- */
function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const role = form.querySelector('input[name="role"]:checked')?.value || "Admin";
    const rawName = (emailInput?.value || "").split("@")[0].trim();
    const name = rawName
      ? rawName.replace(/[._]+/g, " ").replace(/\b\w/g, c => c.toUpperCase())
      : `${role} User`;

    saveProfile({ name, role, department: role === "Admin" ? "Administration" : role });

    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Signing in...";
    }
    setTimeout(() => {
      window.location.href = form.getAttribute("action") || "dashboard.html";
    }, 350);
  });
}

/* ---------- "Coming soon" placeholders (Add / Edit / Forgot password, etc.) ---------- */
function initComingSoonLinks() {
  document.querySelectorAll("[data-coming-soon]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      toast(el.getAttribute("data-coming-soon"), "info");
    });
  });
}

/* ---------- Generic row/card filtering helpers ---------- */
function filterTableRows(input, table, matcher) {
  if (!input || !table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const run = () => {
    let visible = 0;
    rows.forEach(row => {
      const show = matcher(row);
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });
    return visible;
  };
  return run;
}

/* Teachers page: search box + department + availability filters combined */
function initTeachersPage() {
  const table = document.getElementById("teachersTable");
  if (!table) return;
  const searchInput = document.getElementById("teacherSearch");
  const deptFilter = document.getElementById("deptFilter");
  const availFilter = document.getElementById("availFilter");
  const emptyState = document.getElementById("teachersEmpty");
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  function apply() {
    const term = (searchInput?.value || "").trim().toLowerCase();
    const dept = deptFilter?.value || "ALL";
    const avail = availFilter?.value || "ALL";
    let visible = 0;

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const name = cells[1]?.textContent.toLowerCase() || "";
      const department = cells[2]?.textContent.trim() || "";
      const subject = cells[3]?.textContent.toLowerCase() || "";
      const availability = row.querySelector(".badge")?.textContent.trim() || "";

      const matchesTerm = !term || name.includes(term) || subject.includes(term) || department.toLowerCase().includes(term);
      const matchesDept = dept === "ALL" || department === dept;
      const matchesAvail = avail === "ALL" || availability === avail;

      const show = matchesTerm && matchesDept && matchesAvail;
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });

    if (emptyState) emptyState.hidden = visible !== 0;
  }

  searchInput?.addEventListener("input", apply);
  deptFilter?.addEventListener("change", apply);
  availFilter?.addEventListener("change", apply);
}

/* Subjects page: simple search */
function initSubjectsPage() {
  const table = document.getElementById("subjectsTable");
  if (!table) return;
  const searchInput = document.getElementById("subjectSearch");
  const emptyState = document.getElementById("subjectsEmpty");
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  function apply() {
    const term = (searchInput?.value || "").trim().toLowerCase();
    let visible = 0;
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const show = !term || text.includes(term);
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  searchInput?.addEventListener("input", apply);
}

/* Classrooms page: search + status filter over cards */
function initClassroomsPage() {
  const grid = document.getElementById("roomGrid");
  if (!grid) return;
  const searchInput = document.getElementById("classroomSearch");
  const statusFilter = document.getElementById("classroomStatusFilter");
  const cards = Array.from(grid.querySelectorAll(".room-card"));

  function apply() {
    const term = (searchInput?.value || "").trim().toLowerCase();
    const status = statusFilter?.value || "ALL";
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const badge = card.querySelector(".badge")?.textContent.trim() || "";
      const matchesTerm = !term || text.includes(term);
      const matchesStatus = status === "ALL" || badge === status;
      card.style.display = matchesTerm && matchesStatus ? "" : "none";
    });
  }

  searchInput?.addEventListener("input", apply);
  statusFilter?.addEventListener("change", apply);
}

/* ---------- Topbar quick search: jump to a matching section ---------- */
function initTopbarSearch() {
  const input = document.querySelector(".topbar .search");
  const nav = document.querySelector(".nav");
  if (!input || !nav) return;

  const links = Array.from(nav.querySelectorAll("a"));

  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    links.forEach(a => {
      const label = a.textContent.trim().toLowerCase();
      a.style.opacity = !term || label.includes(term) ? "1" : "0.35";
    });
  });

  input.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const term = input.value.trim().toLowerCase();
    if (!term) return;
    const match = links.find(a => a.textContent.trim().toLowerCase().includes(term));
    if (match) {
      window.location.href = match.getAttribute("href");
    } else {
      toast(`No page found for "${input.value.trim()}".`, "error");
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => links.forEach(a => (a.style.opacity = "1")), 150);
  });
}

/* ---------- Settings persistence ---------- */
function initSettingsForm() {
  const form = document.getElementById("settingsForm");
  if (!form) return;

  const profile = getProfile();
  const nameInput = document.getElementById("settingName");
  const deptInput = document.getElementById("settingDepartment");
  if (nameInput && profile.name) nameInput.value = profile.name;
  if (deptInput && profile.department) deptInput.value = profile.department;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: nameInput?.value.trim() || profile.name,
      department: deptInput?.value.trim() || profile.department
    };
    saveProfile(updated);
    initNavAndProfile();

    const msg = document.getElementById("settings-message");
    if (msg) {
      msg.textContent = "Changes saved successfully.";
      msg.className = "schedule-message success";
      msg.hidden = false;
    }
    toast("Settings saved.", "success");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSidebarToggle();
  initNavAndProfile();
  initTodayDate();
  initLoginForm();
  initComingSoonLinks();
  initTeachersPage();
  initSubjectsPage();
  initClassroomsPage();
  initTopbarSearch();
  initSettingsForm();
});
