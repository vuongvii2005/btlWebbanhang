/**
 * Authentication manager.
 * Frontend auth source: JWT stored in localStorage.
 */

const AUTH_LOGIN_API = `${window.APP_API_URL}?controller=auth&action=login`;
const AUTH_REGISTER_API = `${window.APP_API_URL}?controller=auth&action=register`;
const AUTH_PROFILE_API = `${window.APP_API_URL}?controller=auth&action=profile`;
const AUTH_LOGOUT_API = `${window.APP_API_URL}?controller=auth&action=logout`;
const AUTH_CHANGE_PASSWORD_API = `${window.APP_API_URL}?controller=auth&action=change-password`;
const AUTH_DEFAULT_AVATAR = 'assets/img/avt_mac_dinh.jpg';

// ===== CHECK LOGIN STATUS ON PAGE LOAD =====
async function checkLogin() {
    const token = getAuthToken();
    const cachedUser = getCurrentUser();

    if (!token) {
        clearAuth();
        hideLoginModal();
        enablePageScroll();
        return;
    }

    try {
        const result = await apiFetch(AUTH_PROFILE_API);
        const user = result.data;

        localStorage.setItem('auth_user', JSON.stringify(user));
        enablePageScroll();
        hideLoginModal();
        clearAuthErrors();
        updateHeaderUI(user);

        if (user.role === 'admin' && !window.location.pathname.endsWith('/admin.html')) {
            window.location.href = 'admin.html';
        }
    } catch (error) {
        if (isAuthError(error)) {
            clearAuth();
            hideLoginModal();
            enablePageScroll();
            return;
        }

        // Server/network errors should not force logout or redirect.
        if (cachedUser) {
            enablePageScroll();
            hideLoginModal();
            updateHeaderUI(cachedUser);
        } else {
            hideLoginModal();
            enablePageScroll();
        }
        showError(error.message || 'Không thể kiểm tra phiên đăng nhập.');
    }
}

// ===== SHOW/HIDE LOGIN MODAL =====
function showLoginModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.classList.remove('hidden');
    }
}

function hideLoginModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.classList.add('hidden');
    }
}

// ===== DISABLE/ENABLE SCROLL =====
function disablePageScroll() {
    document.body.style.overflow = 'hidden';
}

function enablePageScroll() {
    document.body.style.overflow = 'auto';
}

// ===== SHOW/CLEAR ERROR MESSAGE =====
function showError(message) {
    const errorEl = document.querySelector('.auth-error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

function clearAuthErrors() {
    const errorEl = document.querySelector('.auth-error-message');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

// ===== HANDLE LOGIN FORM SUBMISSION =====
function handleLoginSubmit(event) {
    event.preventDefault();

    const identifier = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!identifier || !password) {
        showError('Vui lòng nhập đầy đủ số điện thoại/email và mật khẩu');
        return false;
    }

    performLogin(identifier, password);
    return false;
}

async function performLogin(identifier, password) {
    clearAuthErrors();

    try {
        const result = await apiFetch(AUTH_LOGIN_API, {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });

        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));

        updateHeaderUI(result.data.user);
        hideLoginModal();
        enablePageScroll();
        clearAuthErrors();

        if (result.data.user.role === 'admin') {
            window.location.href = 'admin.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Đăng nhập thất bại');
    }
}

// ===== HANDLE REGISTER FORM SUBMISSION =====
function handleRegisterSubmit(event) {
    event.preventDefault();

    const fullname = document.getElementById('registerFullname').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();

    if (!fullname || !phone || !password) {
        showError('Vui lòng nhập đầy đủ tên, số điện thoại và mật khẩu');
        return false;
    }

    if (password.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự');
        return false;
    }

    if (password !== confirmPassword) {
        showError('Mật khẩu xác nhận không khớp');
        return false;
    }

    performRegister(fullname, phone, password, email);
    return false;
}

async function performRegister(fullname, phone, password, email) {
    clearAuthErrors();

    try {
        await apiFetch(AUTH_REGISTER_API, {
            method: 'POST',
            body: JSON.stringify({ fullname, phone, password, email })
        });

        switchToLogin();

        [
            'registerFullname',
            'registerPhone',
            'registerEmail',
            'registerPassword',
            'registerConfirmPassword'
        ].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        showError('Đăng ký thành công!');
    } catch (error) {
        console.error('Register error:', error);
        showError(error.message || 'Đăng ký thất bại');
    }
}

// ===== SWITCH BETWEEN LOGIN/REGISTER TABS =====
function switchToLogin() {
    showLoginModal();
    disablePageScroll();

    const loginTab = document.querySelector('.auth-tab-login');
    const registerTab = document.querySelector('.auth-tab-register');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginTab) loginTab.classList.add('active');
    if (registerTab) registerTab.classList.remove('active');

    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';

    clearAuthErrors();
}

function switchToRegister() {
    const loginTab = document.querySelector('.auth-tab-login');
    const registerTab = document.querySelector('.auth-tab-register');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginTab) loginTab.classList.remove('active');
    if (registerTab) registerTab.classList.add('active');

    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';

    clearAuthErrors();
}

// ===== UPDATE HEADER UI AFTER LOGIN =====
function updateHeaderUI(user) {
    const userActions = document.querySelector('.user-actions');

    if (!userActions) return;

    const avatarUrl = user.avatar_url || AUTH_DEFAULT_AVATAR;

    userActions.innerHTML = `
        <div class="user-menu-wrapper">
            <div class="user-greeting">
                <img class="header-user-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(user.fullname || 'Tài khoản')}" width="30" height="30">
                <span class="greeting-text">${escapeHtml(user.fullname || 'Tài khoản')}</span>
                <i class="fa-light fa-caret-down"></i>
            </div>

            <div class="user-dropdown-menu">
                <a href="profile.html" class="user-menu-item">
                    <img class="user-menu-avatar" src="${escapeHtml(avatarUrl)}" alt="" width="20" height="20"> Thông tin tài khoản
                </a>
                <a href="javascript:void(0)" class="user-menu-item logout-item" onclick="logout()">
                    <i class="fa-light fa-right-from-bracket"></i> Đăng xuất
                </a>
            </div>
        </div>
    `;

    const userGreeting = document.querySelector('.user-greeting');
    if (userGreeting) {
        userGreeting.addEventListener('click', toggleUserDropdown);
    }

    document.querySelectorAll('.header-user-avatar, .user-menu-avatar').forEach((avatar) => {
        avatar.addEventListener('error', () => {
            avatar.src = AUTH_DEFAULT_AVATAR;
        });
    });
}

// ===== TOGGLE USER DROPDOWN MENU =====
function toggleUserDropdown() {
    const menu = document.querySelector('.user-dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// ===== USER PROFILE ACTIONS =====
function viewProfile() {
    const user = getCurrentUser();
    if (!user) {
        showLoginModal();
        disablePageScroll();
        return;
    }
    window.location.href = 'profile.html';
}

async function changePassword() {
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if (!newPassword || newPassword.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }

    const oldPassword = prompt('Nhập mật khẩu hiện tại:');
    if (!oldPassword) return;

    try {
        await apiFetch(AUTH_CHANGE_PASSWORD_API, {
            method: 'POST',
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        alert('Đổi mật khẩu thành công!');
    } catch (error) {
        if (isAuthError(error)) {
            window.location.href = 'index.html';
            return;
        }
        console.error('Password change error:', error);
        alert(error.message || 'Đổi mật khẩu thất bại');
    }
}

// ===== LOGOUT =====
async function logout() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;

    try {
        await apiFetch(AUTH_LOGOUT_API, {
            method: 'POST',
            body: JSON.stringify({})
        });
    } catch (error) {
        if (!isAuthError(error)) {
            console.warn('Logout API failed:', error);
        }
    } finally {
        clearAuth();
        window.location.href = 'index.html';
    }
}

// ===== INIT AUTH ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
});
