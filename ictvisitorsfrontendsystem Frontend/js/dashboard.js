// Updated dashboard.js with time formatting fix and full visitor management functionality
const API_BASE_URL = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL : "https://localhost:7099/api";

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
  if (!time) return "00:00:00";
  return time.length === 5 ? `${time}:00` : time;
}

async function loadVisitors() {
  try {
    const res = await fetch(`${API_BASE_URL}/visitors`);
    const data = await res.json();
    const tbody = document.getElementById("visitorsData");
    tbody.innerHTML = data.map(v => `
      <tr>
        <td>${v.full_Name}</td>
        <td>${v.program}</td>
        <td>${v.student_Year}</td>
        <td>${v.purpose}</td>
        <td>${new Date(v.visiteDate).toLocaleDateString()}</td>
        <td>${v.time_in}</td>
        <td>${v.time_out}</td>
        <td>
          <button class="action-btn" onclick='openVisitorModal(${JSON.stringify(v)})'><i class="fas fa-edit"></i></button>
          <button class="action-btn" onclick='deleteVisitor(${v.id})'><i class="fas fa-trash-alt"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("Error loading visitors:", err);
    showToast("❌ Failed to load visitors.", "error");
  }
}

let lastDeletedVisitor = null;
async function deleteVisitor(id) {
  if (!confirm("Are you sure you want to delete this visitor?")) return;
  try {
    const original = await fetch(`${API_BASE_URL}/visitors/${id}`);
    const visitor = await original.json();
    const res = await fetch(`${API_BASE_URL}/visitors/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete visitor");
    lastDeletedVisitor = visitor;
    showToastWithUndo("🗑️ Visitor deleted.", async () => {
      const undoRes = await fetch(`${API_BASE_URL}/visitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastDeletedVisitor)
      });
      if (undoRes.ok) {
        showToast("↩️ Deletion undone.");
        loadVisitors();
      } else {
        showToast("❌ Undo failed.", "error");
      }
    });
    loadVisitors();
  } catch (err) {
    console.error("Delete error:", err);
    showToast("❌ Failed to delete visitor.", "error");
  }
}

function searchVisitors() {
  const name = document.getElementById("searchName").value.toLowerCase();
  const date = document.getElementById("searchDate").value;
  const rows = document.querySelectorAll("#visitorsData tr");
  let results = 0;
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const rowName = cells[0].textContent.toLowerCase();
    const rowDate = cells[4].textContent;
    const matchesName = name === "" || rowName.includes(name);
    const matchesDate = date === "" || rowDate === new Date(date).toLocaleDateString();
    const match = matchesName && matchesDate;
    if (match) results++;
    row.style.display = match ? "" : "none";
  });
  showToast(`🔍 ${results} visitor(s) matched your search.`);
}

function exportToExcel() {
  const table = document.querySelector("table");
  const workbook = XLSX.utils.table_to_book(table, { sheet: "Visitors" });
  XLSX.writeFile(workbook, "Visitors.xlsx");
  showToast("✅ Exported to Excel.");
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.autoTable({ html: 'table' });
  doc.save("Visitors.pdf");
  showToast("✅ Exported to PDF.");
}

function drawChart() {
  const ctx = document.getElementById('visitorsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{
        label: 'Visitors',
        data: [5, 8, 3, 7, 4],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } }
    }
  });
}

function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  document.getElementById("profile-name").textContent = user?.name || "User";
  document.getElementById("profile-avatar").src = user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`;
}

function openVisitorModal(visitor = null) {
  const modal = document.getElementById("visitorModal");
  modal.style.display = "flex";
  modal.classList.add("fade-in");
  document.getElementById("modalTitle").textContent = visitor ? "Edit Visitor" : "Add Visitor";
  document.getElementById("visitorForm").reset();
  if (visitor) {
    document.getElementById("visitorId").value = visitor.id;
    document.getElementById("fullName").value = visitor.full_Name;
    document.getElementById("program").value = visitor.program;
    document.getElementById("year").value = visitor.student_Year;
    document.getElementById("purpose").value = visitor.purpose;
    document.getElementById("visitDate").value = visitor.visiteDate.split("T")[0];
    document.getElementById("timeIn").value = visitor.time_in;
    document.getElementById("timeOut").value = visitor.time_out;
  }
  showToast(visitor ? "✏️ Editing visitor." : "➕ Add new visitor");
}

function closeVisitorModal() {
  const modal = document.getElementById("visitorModal");
  modal.classList.remove("fade-in");
  setTimeout(() => {
    modal.style.display = "none";
    showToast("❌ Visitor modal closed.", "error");
  }, 300);
}

document.getElementById("visitorForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const timeInRaw = document.getElementById("timeIn").value;
  const timeOutRaw = document.getElementById("timeOut").value;
  const visitor = {
    id: document.getElementById("visitorId").value,
    full_Name: document.getElementById("fullName").value,
    program: document.getElementById("program").value,
    student_Year: document.getElementById("year").value,
    purpose: document.getElementById("purpose").value,
    visiteDate: document.getElementById("visitDate").value,
    time_in: formatTimeToHHMMSS(timeInRaw),
    time_out: formatTimeToHHMMSS(timeOutRaw)
  };
  const method = visitor.id ? "PUT" : "POST";
  const url = visitor.id
    ? `${API_BASE_URL}/visitors/${visitor.id}`
    : `${API_BASE_URL}/visitors`;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitor)
    });
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
