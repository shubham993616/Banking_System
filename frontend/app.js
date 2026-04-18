/**
 * NexBank — Banking System Frontend
 * Vanilla JavaScript for CRUD + Banking operations via REST API
 */

// =============================================
// Configuration
// =============================================

const API_BASE_URL = 'http://localhost:8081/api/accounts';

// =============================================
// DOM References
// =============================================

const accountsTableBody = document.getElementById('accounts-tbody');
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

// Transaction modal
const txnModalOverlay = document.getElementById('txn-modal-overlay');
const txnModalClose = document.getElementById('txn-modal-close');
const txnForm = document.getElementById('txn-form');
const txnModalTitle = document.getElementById('txn-modal-title');
const txnBtnText = document.getElementById('txn-btn-text');
const txnSubmitBtn = document.getElementById('txn-submit-btn');
const txnAccountInfo = document.getElementById('txn-account-info');

// History modal
const historyOverlay = document.getElementById('history-overlay');
const historyClose = document.getElementById('history-close');
const historyTitle = document.getElementById('history-title');
const historyAccountInfo = document.getElementById('history-account-info');
const historyTableWrapper = document.getElementById('history-table-wrapper');
const historyTbody = document.getElementById('history-tbody');
const historyLoading = document.getElementById('history-loading');
const historyEmpty = document.getElementById('history-empty');
const historyPagination = document.getElementById('history-pagination');
const historyPrevBtn = document.getElementById('history-prev-btn');
const historyNextBtn = document.getElementById('history-next-btn');
const historyPageInfo = document.getElementById('history-page-info');
const globalLoading = document.getElementById('global-loading');

// Stats
const totalAccountsEl = document.getElementById('total-accounts');
const totalBalanceEl = document.getElementById('total-balance');
const savingsCountEl = document.getElementById('savings-count');
const currentCountEl = document.getElementById('current-count');

// All accounts data (cached for search/filter)
let allAccounts = [];
let deleteTargetId = null;
let activeRequestCount = 0;
let historyState = { accountId: null, page: 0, totalPages: 0 };

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
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-section="${sectionName}"]`)?.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionName}-section`)?.classList.add('active');
}

// =============================================
// API Functions
// =============================================

/**
 * Fetch all accounts from the backend.
 * API now returns { status, message, data } wrapper.
 */
async function fetchAccounts() {
    try {
        const result = await apiRequest(API_BASE_URL);
        allAccounts = result.data || result; // Support both ApiResponse and raw array
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
    const submitBtn = document.getElementById('submit-btn');
    setButtonLoading(submitBtn, true, 'Creating...');

    try {
        const result = await apiRequest(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData),
        });
        const data = result.data || result;
        showToast(`Account created successfully for ${data.accountHolderName}`, 'success');
        resetForm();
        switchSection('dashboard');
        fetchAccounts();
    } catch (error) {
        console.error('Error creating account:', error);
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false, `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Account`);
    }
}

/**
 * Update an existing account.
 */
async function updateAccount(id, accountData) {
    const submitBtn = editForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Saving...');

    try {
        await apiRequest(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData),
        });

        showToast('Account updated successfully', 'success');
        closeModal();
        fetchAccounts();
    } catch (error) {
        console.error('Error updating account:', error);
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false, 'Save Changes');
    }
}

/**
 * Delete an account.
 */
async function deleteAccount(id) {
    setButtonLoading(confirmDeleteBtn, true, 'Deleting...');

    try {
        await apiRequest(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });

        showToast('Account deleted successfully', 'success');
        closeDeleteModal();
        fetchAccounts();
    } catch (error) {
        console.error('Error deleting account:', error);
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(confirmDeleteBtn, false, 'Delete Account');
    }
}

/**
 * Deposit money into an account.
 */
async function depositMoney(accountId, amount) {
    setButtonLoading(txnSubmitBtn, true, 'Processing...');

    try {
        const result = await apiRequest(`${API_BASE_URL}/${accountId}/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount) }),
        });

        const data = result.data || result;
        showToast(`₹${formatBalance(amount)} deposited successfully. New balance: ₹${formatBalance(data.balance)}`, 'success');
        closeTxnModal();
        fetchAccounts();
    } catch (error) {
        console.error('Error depositing:', error);
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(txnSubmitBtn, false, txnBtnText.dataset.originalText || 'Confirm');
    }
}

/**
 * Withdraw money from an account.
 */
async function withdrawMoney(accountId, amount) {
    setButtonLoading(txnSubmitBtn, true, 'Processing...');

    try {
        const result = await apiRequest(`${API_BASE_URL}/${accountId}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount) }),
        });

        const data = result.data || result;
        showToast(`₹${formatBalance(amount)} withdrawn successfully. New balance: ₹${formatBalance(data.balance)}`, 'success');
        closeTxnModal();
        fetchAccounts();
    } catch (error) {
        console.error('Error withdrawing:', error);
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(txnSubmitBtn, false, txnBtnText.dataset.originalText || 'Confirm');
    }
}

/**
 * Fetch transaction history for an account.
 */
async function fetchTransactions(accountId, page = 0) {
    historyState.accountId = accountId;
    historyState.page = page;
    historyLoading.style.display = 'flex';
    historyTableWrapper.style.display = 'none';
    historyEmpty.style.display = 'none';
    historyPagination.style.display = 'none';

    try {
        const result = await apiRequest(`${API_BASE_URL}/${accountId}/transactions?page=${page}&size=10`);
        const payload = result.data || result;
        const transactions = payload.content || [];
        historyState.totalPages = payload.totalPages || 0;

        if (transactions.length === 0) {
            historyLoading.style.display = 'none';
            historyEmpty.style.display = 'block';
            historyPageInfo.textContent = 'Page 0 of 0';
            historyPrevBtn.disabled = true;
            historyNextBtn.disabled = true;
            return;
        }

        historyTbody.innerHTML = transactions.map(txn => `
            <tr>
                <td>#${txn.id}</td>
                <td>${formatDateTime(txn.timestamp)}</td>
                <td>
                    <span class="badge ${txn.type === 'DEPOSIT' ? 'badge-deposit' : 'badge-withdraw'}">
                        ${txn.type === 'DEPOSIT' ? '↑' : '↓'} ${txn.type}
                    </span>
                </td>
                <td class="${txn.type === 'DEPOSIT' ? 'amount-deposit' : 'amount-withdraw'}">
                    ${txn.type === 'DEPOSIT' ? '+' : '-'}₹${formatBalance(txn.amount)}
                </td>
                <td class="balance-cell">₹${formatBalance(txn.balanceAfterTransaction)}</td>
            </tr>
        `).join('');

        historyLoading.style.display = 'none';
        historyTableWrapper.style.display = 'block';
        historyPagination.style.display = 'flex';
        historyPageInfo.textContent = `Page ${payload.page + 1} of ${payload.totalPages}`;
        historyPrevBtn.disabled = payload.page <= 0;
        historyNextBtn.disabled = payload.page >= payload.totalPages - 1;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        historyLoading.style.display = 'none';
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
    const tableWrapper = document.querySelector('#dashboard-section .table-wrapper');

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
            <td class="balance-cell ${parseFloat(account.balance) < 0 ? 'balance-negative' : ''}">₹${formatBalance(account.balance)}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action btn-deposit" title="Deposit" onclick="openTxnModal(${account.id}, 'deposit')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>Deposit</span>
                    </button>
                    <button class="btn-action btn-withdraw" title="Withdraw" onclick="openTxnModal(${account.id}, 'withdraw')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>Withdraw</span>
                    </button>
                    <button class="btn-action btn-history" title="History" onclick="openHistoryModal(${account.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </button>
                    <button class="btn-icon edit" title="Edit" onclick="openEditModal(${account.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete" title="Delete" onclick="openDeleteModal(${account.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

    const name = document.getElementById('accountHolderName').value.trim();
    const type = document.getElementById('accountType').value;
    const balance = document.getElementById('balance').value;

    if (!name) { showToast('Account holder name is required', 'error'); return; }
    if (!type) { showToast('Please select an account type', 'error'); return; }
    if (!balance || parseFloat(balance) < 0) { showToast('Please enter a valid balance', 'error'); return; }

    const formData = {
        accountHolderName: name,
        email: document.getElementById('email').value.trim() || null,
        phoneNumber: document.getElementById('phoneNumber').value.trim() || null,
        accountType: type,
        balance: parseFloat(balance),
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

// Transaction form submission
txnForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('txn-account-id').value;
    const type = document.getElementById('txn-type').value;
    const amount = document.getElementById('txn-amount').value;

    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter a valid amount greater than zero', 'error');
        return;
    }

    if (type === 'deposit') {
        depositMoney(accountId, amount);
    } else {
        withdrawMoney(accountId, amount);
    }
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
    setButtonLoading(refreshBtn, true, 'Loading...');
    fetchAccounts().finally(() => {
        setTimeout(() => {
            setButtonLoading(refreshBtn, false, `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                Refresh`);
        }, 400);
    });
});

// =============================================
// Transaction Modal Helpers
// =============================================

function openTxnModal(id, type) {
    const account = allAccounts.find(a => a.id === id);
    if (!account) return;

    document.getElementById('txn-account-id').value = id;
    document.getElementById('txn-type').value = type;
    document.getElementById('txn-amount').value = '';

    const isDeposit = type === 'deposit';
    txnModalTitle.textContent = isDeposit ? 'Deposit Money' : 'Withdraw Money';

    const btnText = isDeposit ? 'Confirm Deposit' : 'Confirm Withdrawal';
    txnBtnText.textContent = btnText;
    txnBtnText.dataset.originalText = btnText;

    txnSubmitBtn.className = `btn ${isDeposit ? 'btn-success' : 'btn-warning'}`;

    txnAccountInfo.innerHTML = `
        <div class="txn-info-row">
            <span class="txn-info-label">Account</span>
            <span class="txn-info-value">${escapeHtml(account.accountHolderName)}</span>
        </div>
        <div class="txn-info-row">
            <span class="txn-info-label">Account No.</span>
            <span class="txn-info-value account-number">${account.accountNumber}</span>
        </div>
        <div class="txn-info-row">
            <span class="txn-info-label">Current Balance</span>
            <span class="txn-info-value balance-cell">₹${formatBalance(account.balance)}</span>
        </div>
        <div class="txn-info-row">
            <span class="txn-info-label">Type</span>
            <span class="txn-info-value">
                <span class="badge ${account.accountType === 'SAVINGS' ? 'badge-savings' : 'badge-current'}">${account.accountType}</span>
            </span>
        </div>
    `;

    txnModalOverlay.classList.add('active');
    document.getElementById('txn-amount').focus();
}

function closeTxnModal() {
    txnModalOverlay.classList.remove('active');
    txnForm.reset();
}

txnModalClose.addEventListener('click', closeTxnModal);
txnModalOverlay.addEventListener('click', (e) => {
    if (e.target === txnModalOverlay) closeTxnModal();
});

// =============================================
// History Modal Helpers
// =============================================

function openHistoryModal(id) {
    const account = allAccounts.find(a => a.id === id);
    if (!account) return;

    historyTitle.textContent = `Transaction History`;
    historyAccountInfo.innerHTML = `
        <div class="txn-info-row">
            <span class="txn-info-label">Account</span>
            <span class="txn-info-value">${escapeHtml(account.accountHolderName)} — ${account.accountNumber}</span>
        </div>
        <div class="txn-info-row">
            <span class="txn-info-label">Balance</span>
            <span class="txn-info-value balance-cell">₹${formatBalance(account.balance)}</span>
        </div>
    `;

    historyOverlay.classList.add('active');
    fetchTransactions(id, 0);
}

function closeHistoryModal() {
    historyOverlay.classList.remove('active');
    historyState = { accountId: null, page: 0, totalPages: 0 };
}

historyClose.addEventListener('click', closeHistoryModal);
historyOverlay.addEventListener('click', (e) => {
    if (e.target === historyOverlay) closeHistoryModal();
});

historyPrevBtn.addEventListener('click', () => {
    if (historyState.accountId !== null && historyState.page > 0) {
        fetchTransactions(historyState.accountId, historyState.page - 1);
    }
});

historyNextBtn.addEventListener('click', () => {
    if (historyState.accountId !== null && historyState.page < historyState.totalPages - 1) {
        fetchTransactions(historyState.accountId, historyState.page + 1);
    }
});

// =============================================
// Edit / Delete Modal Helpers
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

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
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
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

/**
 * Set a button to loading state or restore it.
 * @param {HTMLElement} button
 * @param {boolean} isLoading
 * @param {string} text
 */
function setButtonLoading(button, isLoading, text) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('btn-loading');
        button.innerHTML = `<div class="spinner"></div> ${text}`;
    } else {
        button.disabled = false;
        button.classList.remove('btn-loading');
        button.innerHTML = text;
    }
}

function setGlobalLoading(isLoading) {
    if (isLoading) {
        activeRequestCount += 1;
    } else {
        activeRequestCount = Math.max(0, activeRequestCount - 1);
    }
    globalLoading.style.display = activeRequestCount > 0 ? 'flex' : 'none';
}

async function apiRequest(url, options = {}) {
    setGlobalLoading(true);
    try {
        const response = await fetch(url, options);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = result.message || result.error || 'Request failed';
            throw new Error(message);
        }
        return result;
    } finally {
        setGlobalLoading(false);
    }
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
        closeTxnModal();
        closeHistoryModal();
    }
});

// =============================================
// Initialize
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    fetchAccounts();
});
