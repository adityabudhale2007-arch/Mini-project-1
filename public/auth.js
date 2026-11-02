const AUTH_URL = "/api/auth";

function destinationFor(user) {
  if (user.role === "admin") return "admin/dashboard.html";
  if (user.role === "faculty") return "faculty/dashboard.html";
  if (user.isProfileComplete) return "student/dashboard.html";
  return "student/onboarding.html";
}

// ---------- SIGN UP ----------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    if (password !== document.getElementById("confirmPassword").value) {
      return alert("Passwords do not match");
    }

    try {
      const res = await fetch(`${AUTH_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: document.getElementById("fullName").value.trim(),
          email: document.getElementById("email").value.trim(),
          rollNumber: document.getElementById("rollNo").value.trim(),
          password,
          role: document.getElementById("role").value
        })
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) window.location.href = "login.html";
    } catch (err) {
      alert("Cannot reach the server. Is node server.js running?");
    }
  });
}

// ---------- LOGIN ----------
const loginFormEl = document.getElementById("loginForm");
if (loginFormEl) {
  const message = document.getElementById("loginMessage");
  const showMessage = (text) => { message.textContent = text; message.hidden = false; };
  const emailInput = document.getElementById("email");

  loginFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.hidden = true;

    try {
      const res = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: emailInput.value.trim(),
          password: document.getElementById("password").value,
          role: document.getElementById("role").value
        })
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.message || "Login failed");

      const user = data.user;
      localStorage.setItem("token", data.accessToken);
      if (typeof API !== "undefined" && API.setAccessToken) API.setAccessToken(data.accessToken);
      if (typeof DemoStore !== "undefined" && DemoStore.setSession) DemoStore.setSession(user);

      window.location.replace(destinationFor(user));
    } catch (err) {
      showMessage("Cannot reach the server. Is node server.js running?");
    }
  });
}