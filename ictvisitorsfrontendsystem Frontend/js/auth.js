const API_BASE_URL = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL : "https://localhost:7099/api";

const login = async () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    alert(data.message || "Login failed");
  }
};

const register = async () => {
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("Registered successfully! You can now log in.");
    window.location.href = "index.html";
  } else {
    alert(data.message || "Registration failed");
  }
};

const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
};

// Google Sign-in handler
function handleCredentialResponse(response) {
  console.log("Google token: ", response.credential);

  // Send the credential to your backend to verify and login/register
  fetch(`${API_BASE_URL}/auth/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: response.credential }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.token) {
        alert(data.message || "Google login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    })
    .catch(() => alert("Google login failed"));
}
