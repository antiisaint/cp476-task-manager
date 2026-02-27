(function () {
  const USERS_KEY = "tm_users";
  const SESSION_KEY = "tm_session";

  const loginTab = document.getElementById("showLogin");
  const registerTab = document.getElementById("showRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authMessage = document.getElementById("authMessage");

  const readUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (error) {
      return [];
    }
  };

  const writeUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const showMessage = (message, isSuccess) => {
    authMessage.textContent = message;
    authMessage.classList.toggle("success", Boolean(isSuccess));
  };

  const setView = (mode) => {
    const loginMode = mode === "login";
    loginForm.classList.toggle("hidden", !loginMode);
    registerForm.classList.toggle("hidden", loginMode);
    loginTab.classList.toggle("active", loginMode);
    registerTab.classList.toggle("active", !loginMode);
    showMessage("", false);
  };

  const setSession = (user) => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ name: user.name, email: user.email })
    );
  };

  loginTab.addEventListener("click", () => setView("login"));
  registerTab.addEventListener("click", () => setView("register"));

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    if (name.length < 2 || password.length < 8) {
      showMessage("Use at least 2 characters for name and 8 for password.", false);
      return;
    }

    const users = readUsers();
    const existing = users.find((user) => user.email === email);
    if (existing) {
      showMessage("Email already registered. Please log in.", false);
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    writeUsers(users);
    setSession(newUser);
    showMessage("Account created. Redirecting to dashboard...", true);

    setTimeout(() => {
      window.location.href = "app.html";
    }, 650);
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const users = readUsers();
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      showMessage("Invalid email or password.", false);
      return;
    }

    setSession(user);
    showMessage("Login successful. Redirecting...", true);
    setTimeout(() => {
      window.location.href = "app.html";
    }, 450);
  });

  const existingSession = localStorage.getItem(SESSION_KEY);
  if (existingSession) {
    showMessage("You are already logged in. Redirecting...", true);
    setTimeout(() => {
      window.location.href = "app.html";
    }, 700);
  }
})();
