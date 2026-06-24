const API_AUTH_BASE = `${window.APP_CONFIG.apiBaseUrl}/api/auth`;
const API_BASE_URL = `${window.APP_CONFIG.apiBaseUrl}/api/accounts`;
const TOKEN_KEY = 'nexbank.jwt';

const CREATE_FORM_SUBTITLE_DEFAULT =
    'Each account is linked to one login email. Customers only see their own accounts.';

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
const globalLoading = document.getElementById('global-loading');

const authSection = document.getElementById('auth-section');
const sessionBanner = document.getElementById('session-banner');
const sessionEmail = document.getElementById('session-email');
const sessionRole = document.getElementById('session-role');
const sessionExpiry = document.getElementById('session-expiry');
const logoutBtn = document.getElementById('logout-btn');
const accountsTableTitle = document.getElementById('accounts-table-title');

const txnModalOverlay = document.getElementById('txn-modal-overlay');
const txnModalClose = document.getElementById('txn-modal-close');
const txnForm = document.getElementById('txn-form');
const txnModalTitle = document.getElementById('txn-modal-title');
const txnBtnText = document.getElementById('txn-btn-text');
const txnSubmitBtn = document.getElementById('txn-submit-btn');
const txnAccountInfo = document.getElementById('txn-account-info');

const historyOverlay = document.getElementById('history-overlay');
const historyClose = document.getElementById('history-close');
const historyAccountInfo = document.getElementById('history-account-info');
const historyTableWrapper = document.getElementById('history-table-wrapper');
const historyTbody = document.getElementById('history-tbody');
const historyLoading = document.getElementById('history-loading');
const historyEmpty = document.getElementById('history-empty');
const historyPagination = document.getElementById('history-pagination');
const historyPrevBtn = document.getElementById('history-prev-btn');
const historyNextBtn = document.getElementById('history-next-btn');
const historyPageInfo = document.getElementById('history-page-info');

const totalAccountsEl = document.getElementById('total-accounts');
const totalBalanceEl = document.getElementById('total-balance');
const savingsCountEl = document.getElementById('savings-count');
const currentCountEl = document.getElementById('current-count');

let allAccounts = [];
let deleteTargetId = null;
let activeRequestCount = 0;
let historyState = { accountId: null, page: 0, totalPages: 0 };
let authState = { token: null, email: null, role: null };
let sessionExpiryIntervalId = null;
let pendingUserEmail = '';

// =============================================
// Navigation
// =============================================

document.querySelectorAll('.nav-link').forEach((link) => {
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

async function fetchAccounts() {
    if (!authState.token) {
        renderAccounts([]);
        updateStats([]);
        return;
    }
    try {
        const endpoint = authState.role === 'ADMIN' ? API_BASE_URL : `${API_BASE_URL}/me`;
        const result = await apiRequest(endpoint);
        allAccounts = result.data || result;
        renderAccounts(allAccounts);
        updateStats(allAccounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        showToast('Unable to connect to server. Make sure the backend is running.', 'error');
    }
}

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
                    <span class="badge ${txn.type.includes('DEPOSIT') || txn.type.includes('CREDIT') ? 'badge-deposit' : 'badge-withdraw'}">
                        ${txn.type}
                    </span>
                </td>
                <td class="${txn.type.includes('DEPOSIT') || txn.type.includes('CREDIT') ? 'amount-deposit' : 'amount-withdraw'}">
                    ${txn.type.includes('DEPOSIT') || txn.type.includes('CREDIT') ? '+' : '-'}₹${formatBalance(txn.amount)}
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

function hideEl(id) {
    document.getElementById(id)?.classList.add('hidden');
}

function showEl(id) {
    document.getElementById(id)?.classList.remove('hidden');
}

function resetAuthFlowToRolePicker() {
    showEl('auth-role-picker');
    hideEl('auth-user-panel');
    hideEl('auth-admin-panel');
    ['user-step-email', 'user-step-new', 'user-step-returning', 'user-step-otp-only', 'user-step-forgot'].forEach(hideEl);
    document.getElementById('user-register-final-form')?.classList.add('hidden');
    document.getElementById('user-reset-pass-form')?.classList.add('hidden');
    hideEl('admin-step-otp');
    showEl('admin-step-pass');
    pendingUserEmail = '';
    const sub = document.getElementById('auth-subtitle');
    if (sub) sub.textContent = 'Choose how you want to sign in.';
}

async function sendOtpApi(email) {
    await apiRequest(`${API_AUTH_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }, false);
}

async function resendOtpApi(email) {
    await apiRequest(`${API_AUTH_BASE}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }, false);
}

async function checkEmailRegistered(email) {
    const result = await apiRequest(
        `${API_AUTH_BASE}/check-email?email=${encodeURIComponent(email)}`,
        {},
        false
    );
    const data = result.data !== undefined ? result.data : result;
    return data.registered === true;
}

async function registerCompleteApi(body) {
    const result = await apiRequest(`${API_AUTH_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }, false);
    return result.data?.token;
}

async function loginPasswordApi(body) {
    const result = await apiRequest(`${API_AUTH_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }, false);
    return result.data?.token;
}

async function loginOtpSendApi(email) {
    await apiRequest(`${API_AUTH_BASE}/login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }, false);
}

async function verifyOtpSimpleApi(email, otp) {
    const result = await apiRequest(`${API_AUTH_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    }, false);
    return result.data?.token;
}

async function forgotPasswordApi(email) {
    await apiRequest(`${API_AUTH_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }, false);
}

async function resetPasswordApi(body) {
    await apiRequest(`${API_AUTH_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }, false);
}

async function adminLoginApi(email, password) {
    await apiRequest(`${API_AUTH_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    }, false);
}

async function adminVerifyOtpApi(email, otp) {
    const result = await apiRequest(`${API_AUTH_BASE}/admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    }, false);
    return result.data?.token;
}

async function completeAuthWithToken(token) {
    if (!token) throw new Error('No token received from server.');
    setSession(token);
    updateAuthUI();
    await fetchAccounts();
    showToast('Signed in successfully.', 'success');
}

function setSession(token) {
    authState.token = token;
    const claims = parseJwtClaims(token);
    authState.email = claims.sub || '';
    authState.role = claims.role || 'USER';
    localStorage.setItem(TOKEN_KEY, token);
}

function clearSession() {
    authState = { token: null, email: null, role: null };
    localStorage.removeItem(TOKEN_KEY);
    clearTokenExpiryTicker();
}

function configureAccountFormForRole() {
    const adminGroup = document.getElementById('admin-email-group');
    const userHint = document.getElementById('user-email-hint-group');
    const emailInput = document.getElementById('email');
    const formSubtitle = document.getElementById('form-subtitle');
    if (!adminGroup || !userHint || !emailInput) return;

    if (!authState.token) {
        adminGroup.classList.remove('hidden');
        userHint.classList.add('hidden');
        emailInput.required = false;
        if (formSubtitle) formSubtitle.textContent = CREATE_FORM_SUBTITLE_DEFAULT;
        return;
    }

    if (authState.role === 'ADMIN') {
        adminGroup.classList.remove('hidden');
        userHint.classList.add('hidden');
        emailInput.required = true;
        if (formSubtitle) {
            formSubtitle.textContent =
                'Enter the customer’s registered email so only they can access this account after login.';
        }
    } else {
        adminGroup.classList.add('hidden');
        userHint.classList.remove('hidden');
        emailInput.required = false;
        const display = document.getElementById('user-email-display');
        if (display) display.textContent = authState.email || '';
        if (formSubtitle) {
            formSubtitle.textContent =
                'New accounts are tied to your login; other users never see them.';
        }
    }
}

function updateAuthUI() {
    const isAuthenticated = !!authState.token;
    authSection.classList.toggle('hidden', isAuthenticated);
    sessionBanner.classList.toggle('hidden', !isAuthenticated);
    document.querySelectorAll('.section').forEach((s) => {
        s.classList.toggle('active', false);
        s.classList.toggle('hidden', !isAuthenticated);
    });
    document.querySelectorAll('.nav-link').forEach((link) => {
        link.style.pointerEvents = isAuthenticated ? 'auto' : 'none';
        link.style.opacity = isAuthenticated ? '1' : '0.55';
    });

    if (!isAuthenticated) {
        sessionEmail.textContent = 'Not logged in';
        sessionRole.textContent = 'GUEST';
        sessionRole.className = 'badge badge-current';
        sessionExpiry.textContent = 'Token expiry: N/A';
        resetAuthFlowToRolePicker();
        configureAccountFormForRole();
        return;
    }

    sessionEmail.textContent = authState.email;
    sessionRole.textContent = authState.role;
    sessionRole.className = `badge ${authState.role === 'ADMIN' ? 'badge-current' : 'badge-savings'}`;
    accountsTableTitle.textContent = authState.role === 'ADMIN' ? 'All Accounts (ADMIN)' : 'My Accounts';
    startTokenExpiryTicker();

    document.querySelectorAll('.section').forEach((s) => s.classList.remove('hidden'));
    configureAccountFormForRole();
    switchSection('dashboard');
}

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
        phoneNumber: document.getElementById('phoneNumber').value.trim() || null,
        accountType: type,
        balance: parseFloat(balance),
    };
    if (authState.role === 'ADMIN') {
        const custEmail = document.getElementById('email').value.trim();
        if (!custEmail) {
            showToast('Customer email is required when creating an account as administrator.', 'error');
            return;
        }
        formData.email = custEmail;
    }
    createAccount(formData);
});

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

document.getElementById('btn-user-flow').addEventListener('click', () => {
    hideEl('auth-role-picker');
    showEl('auth-user-panel');
    showEl('user-step-email');
    ['user-step-new', 'user-step-returning', 'user-step-otp-only', 'user-step-forgot'].forEach(hideEl);
    document.getElementById('auth-subtitle').textContent = 'Enter your email to continue.';
});

document.getElementById('btn-admin-flow').addEventListener('click', () => {
    hideEl('auth-role-picker');
    showEl('auth-admin-panel');
    hideEl('admin-step-otp');
    showEl('admin-step-pass');
    document.getElementById('auth-subtitle').textContent = 'Administrator sign-in (password + OTP).';
});

document.getElementById('user-back-to-role').addEventListener('click', resetAuthFlowToRolePicker);
document.getElementById('admin-back-to-role').addEventListener('click', resetAuthFlowToRolePicker);

document.getElementById('user-email-check-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-flow-email').value.trim();
    if (!email) return;
    try {
        const registered = await checkEmailRegistered(email);
        pendingUserEmail = email;
        hideEl('user-step-email');
        if (!registered) {
            showEl('user-step-new');
            document.getElementById('user-register-final-form').classList.add('hidden');
            document.getElementById('auth-subtitle').textContent = 'New account — request a code, then set your details.';
        } else {
            document.getElementById('user-ret-email').value = email;
            showEl('user-step-returning');
            document.getElementById('auth-subtitle').textContent = 'Welcome back — password or email OTP.';
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('user-new-send-otp').addEventListener('click', async () => {
    const email = pendingUserEmail || document.getElementById('user-flow-email').value.trim();
    if (!email) return;
    try {
        await sendOtpApi(email);
        document.getElementById('user-register-final-form').classList.remove('hidden');
        showToast('OTP sent. Check your email.', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('user-register-final-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = pendingUserEmail || document.getElementById('user-flow-email').value.trim();
    const body = {
        email,
        otp: document.getElementById('reg-otp').value.trim(),
        name: document.getElementById('reg-name').value.trim(),
        password: document.getElementById('reg-pass').value,
    };
    const btn = document.getElementById('reg-submit-btn');
    setButtonLoading(btn, true, 'Creating...');
    try {
        const token = await registerCompleteApi(body);
        await completeAuthWithToken(token);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setButtonLoading(btn, false, 'Create account');
    }
});

document.getElementById('user-pw-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-ret-email').value.trim();
    const password = document.getElementById('user-pw').value;
    try {
        const token = await loginPasswordApi({ email, password });
        await completeAuthWithToken(token);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('user-btn-otp-login').addEventListener('click', async () => {
    const email = document.getElementById('user-ret-email').value.trim();
    try {
        await loginOtpSendApi(email);
        document.getElementById('user-otp-login-email').value = email;
        hideEl('user-step-returning');
        showEl('user-step-otp-only');
        document.getElementById('auth-subtitle').textContent = 'Enter the code we emailed you.';
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('user-login-otp-resend').addEventListener('click', async () => {
    const email = document.getElementById('user-otp-login-email').value.trim();
    try {
        await loginOtpSendApi(email);
        showToast('OTP resent.', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('user-otp-only-verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-otp-login-email').value.trim();
    const otp = document.getElementById('user-otp-only-code').value.trim();
    try {
        const token = await verifyOtpSimpleApi(email, otp);
        await completeAuthWithToken(token);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('user-btn-forgot').addEventListener('click', () => {
    hideEl('user-step-returning');
    showEl('user-step-forgot');
    document.getElementById('user-reset-pass-form').classList.add('hidden');
    document.getElementById('auth-subtitle').textContent = 'Reset your password via email code.';
});

document.getElementById('forgot-back').addEventListener('click', () => {
    hideEl('user-step-forgot');
    showEl('user-step-returning');
});

document.getElementById('forgot-send').addEventListener('click', async () => {
    const email = document.getElementById('user-ret-email').value.trim();
    try {
        await forgotPasswordApi(email);
        document.getElementById('user-reset-pass-form').classList.remove('hidden');
        showToast('If an account exists, an OTP was sent.', 'info');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('user-reset-pass-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-ret-email').value.trim();
    const body = {
        email,
        otp: document.getElementById('reset-otp').value.trim(),
        newPassword: document.getElementById('reset-newpw').value,
    };
    try {
        await resetPasswordApi(body);
        showToast('Password updated. Sign in with your new password.', 'success');
        hideEl('user-step-forgot');
        showEl('user-step-returning');
        document.getElementById('user-pw').value = '';
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('admin-pass-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const btn = document.getElementById('admin-pass-submit');
    setButtonLoading(btn, true, 'Sending OTP...');
    try {
        await adminLoginApi(email, password);
        document.getElementById('admin-otp-email').value = email;
        hideEl('admin-step-pass');
        showEl('admin-step-otp');
        showToast('Password OK. OTP sent to your email.', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setButtonLoading(btn, false, 'Continue');
    }
});

document.getElementById('admin-otp-verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-otp-email').value.trim();
    const otp = document.getElementById('admin-otp-code').value.trim();
    try {
        const token = await adminVerifyOtpApi(email, otp);
        await completeAuthWithToken(token);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

logoutBtn.addEventListener('click', () => {
    clearSession();
    allAccounts = [];
    renderAccounts(allAccounts);
    updateStats(allAccounts);
    updateAuthUI();
    showToast('Logged out successfully.', 'info');
});

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

function openHistoryModal(id) {
    const account = allAccounts.find(a => a.id === id);
    if (!account) return;

    document.getElementById('history-title').textContent = 'Transaction History';
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

function openEditModal(id) {
    const account = allAccounts.find(a => a.id === id);
    if (!account) return;

    document.getElementById('modal-edit-id').value = account.id;
    document.getElementById('modal-name').value = account.accountHolderName;
    const modalEmail = document.getElementById('modal-email');
    modalEmail.value = account.email || '';
    modalEmail.readOnly = authState.role !== 'ADMIN';
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

function resetForm() {
    accountForm.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('form-title').textContent = 'Create New Account';
    document.getElementById('form-subtitle').textContent = CREATE_FORM_SUBTITLE_DEFAULT;
    document.getElementById('submit-btn').innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Create Account`;
}

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

async function apiRequest(url, options = {}, withAuth = true) {
    setGlobalLoading(true);
    try {
        const headers = { ...(options.headers || {}) };
        if (withAuth && authState.token) {
            headers.Authorization = `Bearer ${authState.token}`;
        }
        let response;
        try {
            response = await fetch(url, { ...options, headers });
        } catch (networkErr) {
            const hint =
                'Cannot reach the server. Start the Spring Boot app on port 8081. ' +
                'If you opened index.html as a file, use Live Server (http://localhost:…) instead — browsers block file:// API calls.';
            throw new Error(networkErr instanceof TypeError ? hint : networkErr.message);
        }
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = result.message || result.error || 'Request failed';
            if (response.status === 401 && withAuth) {
                clearSession();
                updateAuthUI();
            }
            throw new Error(message);
        }
        return result;
    } finally {
        setGlobalLoading(false);
    }
}

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
        closeTxnModal();
        closeHistoryModal();
    }
});

function parseJwtClaims(token) {
    try {
        const payload = token.split('.')[1];
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(normalized);
        return JSON.parse(decoded);
    } catch (_error) {
        return {};
    }
}

function startTokenExpiryTicker() {
    clearTokenExpiryTicker();
    updateTokenExpiryText();
    sessionExpiryIntervalId = setInterval(updateTokenExpiryText, 1000);
}

function clearTokenExpiryTicker() {
    if (sessionExpiryIntervalId) {
        clearInterval(sessionExpiryIntervalId);
        sessionExpiryIntervalId = null;
    }
}

function updateTokenExpiryText() {
    if (!authState.token) {
        sessionExpiry.textContent = 'Token expiry: N/A';
        return;
    }

    const claims = parseJwtClaims(authState.token);
    if (!claims.exp) {
        sessionExpiry.textContent = 'Token expiry: Unknown';
        return;
    }

    const expiryMs = claims.exp * 1000;
    const remainingMs = expiryMs - Date.now();
    if (remainingMs <= 0) {
        sessionExpiry.textContent = 'Token expiry: Expired';
        clearSession();
        updateAuthUI();
        showToast('Session expired. Please login again.', 'info');
        return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const expiryTime = new Date(expiryMs).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
    sessionExpiry.textContent = `Token expiry in ${minutes}m ${seconds}s (${expiryTime})`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
        setSession(savedToken);
    }
    updateAuthUI();
    if (authState.token) {
        await fetchAccounts();
    }
});
