// TaskTracker Frontend Dashboard

const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let isRegisterMode = false;
let currentPage = 1;

// ─── Auth helpers ────────────────────────────────────────────

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

function showSection(section) {
  document.getElementById('auth-section').style.display = section === 'auth' ? 'block' : 'none';
  document.getElementById('dashboard-section').style.display = section === 'dashboard' ? 'block' : 'none';
}

function showMessage(containerId, text, type) {
  const el = document.getElementById(containerId);
  el.innerHTML = `<div class="message message-${type}">${text}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// ─── Auth ────────────────────────────────────────────────────

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById('auth-title').textContent = isRegisterMode ? 'Register' : 'Login';
  document.getElementById('auth-submit').textContent = isRegisterMode ? 'Register' : 'Login';
  document.getElementById('name-group').style.display = isRegisterMode ? 'block' : 'none';
  document.getElementById('auth-toggle-text').textContent = isRegisterMode
    ? 'Already have an account? '
    : "Don't have an account? ";
  document.getElementById('auth-toggle-link').textContent = isRegisterMode ? 'Login' : 'Register';
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value;
  const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';

  const body = isRegisterMode ? { email, password, name } : { email, password };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!data.success) {
      showMessage('auth-message', data.error || 'Authentication failed', 'error');
      return;
    }

    authToken = data.data.token;
    localStorage.setItem('authToken', authToken);
    document.getElementById('user-email').textContent = email;
    showSection('dashboard');
    await fetchTasks();
  } catch (error) {
    showMessage('auth-message', 'Network error. Please try again.', 'error');
  }
});

function logout() {
  authToken = null;
  localStorage.removeItem('authToken');
  showSection('auth');
}

// ─── Task List ───────────────────────────────────────────────

async function fetchTasks(page = 1) {
  currentPage = page;
  try {
    const res = await fetch(`${API_BASE}/tasks?page=${page}&limit=10&sortBy=createdAt&sortOrder=desc`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      logout();
      showMessage('auth-message', 'Session expired. Please login again.', 'error');
      return;
    }

    const data = await res.json();

    if (!data.success) {
      showMessage('dashboard-message', data.error || 'Failed to load tasks', 'error');
      return;
    }

    renderTaskList(data.data.items);
    renderPagination(data.data.pagination);
  } catch (error) {
    showMessage('dashboard-message', 'Failed to load tasks. Please try again.', 'error');
  }
}

function renderTaskList(tasks) {
  const container = document.getElementById('task-list-container');

  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">No tasks yet. Create one to get started!</div>';
    return;
  }

  const statusClass = { PENDING: 'pending', IN_PROGRESS: 'in-progress', COMPLETED: 'completed' };
  const statusLabel = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
  const priorityClass = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };

  const html = tasks.map(task => {
    const due = task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : '';
    return `
      <div class="task-item">
        <div class="task-info">
          <h3>${escapeHtml(task.title)}</h3>
          <div class="task-meta">
            <span class="badge badge-${statusClass[task.status]}">${statusLabel[task.status]}</span>
            <span class="badge badge-${priorityClass[task.priority]}">${task.priority}</span>
            ${due ? `<span style="margin-left:8px">${due}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-sm btn-secondary" onclick="openEditModal('${task.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `<div class="task-list">${html}</div>`;
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  if (pagination.hasPrev) {
    html += `<button class="btn btn-sm btn-secondary" onclick="fetchTasks(${pagination.page - 1})">Prev</button>`;
  }
  html += `<span style="padding: 4px 10px; font-size: 14px;">Page ${pagination.page} of ${pagination.totalPages}</span>`;
  if (pagination.hasNext) {
    html += `<button class="btn btn-sm btn-secondary" onclick="fetchTasks(${pagination.page + 1})">Next</button>`;
  }
  container.innerHTML = html;
}

// ─── Create / Edit Task ──────────────────────────────────────

let editingTaskId = null;

function openCreateModal() {
  editingTaskId = null;
  document.getElementById('modal-title').textContent = 'Create Task';
  document.getElementById('modal-submit').textContent = 'Create Task';
  document.getElementById('task-form').reset();
  document.getElementById('task-modal').classList.add('active');
}

async function openEditModal(taskId) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) {
      showMessage('dashboard-message', 'Failed to load task', 'error');
      return;
    }
    const task = data.data;
    editingTaskId = taskId;
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('modal-submit').textContent = 'Update Task';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-status').value = task.status;
    if (task.dueDate) {
      document.getElementById('task-due-date').value = new Date(task.dueDate).toISOString().slice(0, 16);
    }
    document.getElementById('task-modal').classList.add('active');
  } catch (error) {
    showMessage('dashboard-message', 'Failed to load task details.', 'error');
  }
}

function closeModal() {
  document.getElementById('task-modal').classList.remove('active');
  document.getElementById('modal-message').innerHTML = '';
  editingTaskId = null;
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const priority = document.getElementById('task-priority').value;
  const status = document.getElementById('task-status').value;
  const dueDateRaw = document.getElementById('task-due-date').value;

  const body = { title, priority, status };
  if (description) body.description = description;
  if (dueDateRaw) body.dueDate = new Date(dueDateRaw).toISOString();

  if (editingTaskId) {
    await updateTask(editingTaskId, body);
  } else {
    await createTask(body);
  }
});

// ─── FIX: createTask now calls fetchTasks() after success ────

async function createTask(taskData) {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await res.json();

    if (!data.success) {
      showMessage('modal-message', data.error || 'Failed to create task', 'error');
      return;
    }

    // Show success message
    showMessage('dashboard-message', 'Task created successfully!', 'success');

    // Close the modal
    closeModal();

    // FIX: Reload the task list so the new task appears immediately
    await fetchTasks(currentPage);
  } catch (error) {
    showMessage('modal-message', 'Network error. Please try again.', 'error');
  }
}

async function updateTask(taskId, taskData) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await res.json();

    if (!data.success) {
      showMessage('modal-message', data.error || 'Failed to update task', 'error');
      return;
    }

    showMessage('dashboard-message', 'Task updated successfully!', 'success');
    closeModal();
    await fetchTasks(currentPage);
  } catch (error) {
    showMessage('modal-message', 'Network error. Please try again.', 'error');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.status === 204) {
      showMessage('dashboard-message', 'Task deleted.', 'success');
      await fetchTasks(currentPage);
      return;
    }

    const data = await res.json();
    showMessage('dashboard-message', data.error || 'Failed to delete task', 'error');
  } catch (error) {
    showMessage('dashboard-message', 'Network error. Please try again.', 'error');
  }
}

// ─── Utility ─────────────────────────────────────────────────

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Init ────────────────────────────────────────────────────

(async function init() {
  if (authToken) {
    showSection('dashboard');
    await fetchTasks();
  } else {
    showSection('auth');
  }
})();
