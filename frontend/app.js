/**
 * NexBank — Banking System Frontend
 * Vanilla JavaScript for CRUD operations via REST API
 */

// =============================================
// Configuration
// =============================================

const API_BASE_URL = 'http://localhost:8081/api/accounts';

// =============================================
// DOM References
// =============================================

const  accountsTableBody = document.getElementById('accounts-tbody');
const accountForm = document.getElementById('account-form');
const editForm = document.getElementById('edit-form');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const deleteOverlay = document.getElementById('delete-overlay');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const emptyState = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');

// Stats
const totalAccountsEl = document.getElementById('total-accounts');
const totalBalanceEl = document.getElementById('total-balance');
const savingsCountEl = document.getElementById('savings-count');
const currentCountEl = document.getElementById('current-count');

// All accounts data (cached for search/filter)
let allAccounts = [];
let deleteTargetId = null;

// =============================================
// Navigation
// =============================================

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        switchSection(section);
    });
});

function switchSection(sectionName) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-section="${sectionName}"]`)?.classList.add('active');

    // Update sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionName}-section`)?.classList.add('active');
}

// =============================================
// API Functions
// =============================================

/**
 * Fetch all accounts from the backend.
 */
async function fetchAccounts() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Failed to fetch accounts');
        allAccounts = await response.json();
        renderAccounts(allAccounts);
        updateStats(allAccounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        showToast('Unable to connect to server. Make sure the backend is running.', 'error');
    }
}

/**
 * Create a new account.
 */
async function createAccount(accountData) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create account');
        }

        showToast(`Account created successfully for ${data.accountHolderName}`, 'success');
        resetForm();
        switchSection('dashboard');
        fetchAccounts();
    } catch (error) {
        console.error('Error creating account:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Update an existing account.
 */
async function updateAccount(id, accountData) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update account');
        }

        showToast('Account updated successfully', 'success');
        closeModal();
        fetchAccounts();
    } catch (error) {
        console.error('Error updating account:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Delete an account.
 */
async function deleteAccount(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete account');
        }

        showToast('Account deleted successfully', 'success');
        closeDeleteModal();
        fetchAccounts();
    } catch (error) {
        console.error('Error deleting account:', error);
        showToast(error.message, 'error');
    }
}

// =============================================
// Render Functions
// =============================================

/**
 * Render the accounts table.
 */
function renderAccounts(accounts) {
    const tableWrapper = document.querySelector('.table-wrapper');

    if (accounts.length === 0) {
        tableWrapper.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableWrapper.style.display = 'block';
    emptyState.style.display = 'none';

    accountsTableBody.innerHTML = accounts.map(account => `
        <tr>
            <td>#${account.id}</td>
            <td class="account-holder-name">${escapeHtml(account.accountHolderName)}</td>
            <td class="account-number">${account.accountNumber}</td>
            <td>
                <span class="badge ${account.accountType === 'SAVINGS' ? 'badge-savings' : 'badge-current'}">
                    ${account.accountType}
                </span>
            </td>
            <td class="balance-cell">₹${formatBalance(account.balance)}</td>
            <td>${account.email || '—'}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" title="Edit" onclick="openEditModal(${account.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete" title="Delete" onclick="openDeleteModal(${account.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update dashboard statistics.
 */
function updateStats(accounts) {
    const total = accounts.length;
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    const savings = accounts.filter(a => a.accountType === 'SAVINGS').length;
    const current = accounts.filter(a => a.accountType === 'CURRENT').length;

    animateNumber(totalAccountsEl, total);
    totalBalanceEl.textContent = `₹${formatBalance(totalBalance)}`;
    animateNumber(savingsCountEl, savings);
    animateNumber(currentCountEl, current);
}

// =============================================
// Event Handlers
// =============================================

// Create account form submission
accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
        accountHolderName: document.getElementById('accountHolderName').value.trim(),
        email: document.getElementById('email').value.trim() || null,
        phoneNumber: document.getElementById('phoneNumber').value.trim() || null,
        accountType: document.getElementById('accountType').value,
        balance: parseFloat(document.getElementById('balance').value),
    };
    createAccount(formData);
});

// Edit form submission
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-edit-id').value;
    const formData = {
        accountHolderName: document.getElementById('modal-name').value.trim(),
        email: document.getElementById('modal-email').value.trim() || null,
        phoneNumber: document.getElementById('modal-phone').value.trim() || null,
        accountType: document.getElementById('modal-type').value,
        balance: parseFloat(document.getElementById('modal-balance').value),
    };
    updateAccount(id, formData);
});

// Search / filter accounts
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allAccounts.filter(a =>
        a.accountHolderName.toLowerCase().includes(query) ||
        a.accountNumber.toLowerCase().includes(query) ||
        a.accountType.toLowerCase().includes(query) ||
        (a.email && a.email.toLowerCase().includes(query))
    );
    renderAccounts(filtered);
});

// Refresh button
refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<div class="spinner"></div> Loading...';
    fetchAccounts().finally(() => {
        setTimeout(() => {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                Refresh`;
        }, 400);
    });
});

// =============================================
// Modal Helpers
// =============================================

function openEditModal(id) {
    const account = allAccounts.find(a => a.id === id);
    if (!account) return;

    document.getElementById('modal-edit-id').value = account.id;
    document.getElementById('modal-name').value = account.accountHolderName;
    document.getElementById('modal-email').value = account.email || '';
    document.getElementById('modal-phone').value = account.phoneNumber || '';
    document.getElementById('modal-type').value = account.accountType;
    document.getElementById('modal-balance').value = account.balance;

    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

function openDeleteModal(id) {
    deleteTargetId = id;
    deleteOverlay.classList.add('active');
}

function closeDeleteModal() {
    deleteTargetId = null;
    deleteOverlay.classList.remove('active');
}

confirmDeleteBtn.addEventListener('click', () => {
    if (deleteTargetId) {
        deleteAccount(deleteTargetId);
    }
});

deleteOverlay.addEventListener('click', (e) => {
    if (e.target === deleteOverlay) closeDeleteModal();
});

// =============================================
// Form Reset
// =============================================

function resetForm() {
    accountForm.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('form-title').textContent = 'Create New Account';
    document.getElementById('form-subtitle').textContent = 'Fill in the details to register a new bank account';
    document.getElementById('submit-btn').innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Create Account`;
}

// =============================================
// Utility Functions
// =============================================

function formatBalance(amount) {
    return parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function animateNumber(element, target) {
    const start = parseInt(element.textContent) || 0;
    const duration = 400;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        element.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success' | 'error' | 'info'} type
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    };

    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

// =============================================
// Keyboard Shortcuts
// =============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// =============================================
// Initialize
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    fetchAccounts();
});
