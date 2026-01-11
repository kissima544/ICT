// Updated dashboard.js with time formatting fix and full visitor management functionality

// Sidebar and Tabs
const tabs = document.querySelectorAll('.sidebar-menu li');
const sections = document.querySelectorAll('.tab-section');
const sidebar = document.querySelector('.sidebar');
const dropdown = document.getElementById('dropdown-menu');

const savedState = localStorage.getItem("sidebar-collapsed");
if (savedState === "true") sidebar.classList.add("collapsed");

// Toast Notifications
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type} show-top`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 5000); // Extended to 6 seconds
  }, 100);
}

function showToastWithUndo(message, undoCallback) {
  const toast = document.createElement('div');
  toast.className = 'toast undo show-top';
  toast.innerHTML = `
    <span>${message}</span>
    <button class="undo-btn">Undo</button>
  `;
  document.body.appendChild(toast);

  toast.querySelector('.undo-btn').addEventListener('click', () => {
    toast.remove();
    undoCallback();
  });

  setTimeout(() => {
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 5000); // Extended to 7 seconds
  }, 100);
}

// Tabs
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(tab.dataset.section).classList.add('active');
  });
  tab.setAttribute("title", tab.textContent.trim());
});

document.getElementById('toggle-sidebar').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  localStorage.setItem("sidebar-collapsed", sidebar.classList.contains('collapsed'));
});

document.getElementById('profile-dropdown').addEventListener('click', () => {
  dropdown.classList.toggle('show');
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function formatTimeToHHMMSS(time) {
  if (!res.ok) throw new Error("Failed to save visitor");
  showToast(visitor.id ? "✅ Visitor updated." : "✅ Visitor added.");
  closeVisitorModal();
  loadVisitors();
} catch (err) {
  console.error(err);
  showToast("❌ Error saving visitor.", "error");
}
});

window.onload = () => {
  loadUserProfile();
  loadVisitors();
  drawChart();
  showToast("👋 Welcome back! Your dashboard is ready.");
};
