/**
 * AUTHENTICATION MANAGER - ENHANCED
 * Handles login, logout, and user state management
 * Key Improvements:
 * - No page reload after login (smooth UX)
 * - Proper modal handling with no infinite loop
 * - Clear error messages
 * - Session-based user info display
 */

// ===== CHECK LOGIN STATUS ON PAGE LOAD =====
function checkLogin() {
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
    const token = localStorage.getItem('auth_token');
    
    // ALREADY LOGGED IN - Hide modal, show user info
    if (user && token) {
        enablePageScroll();
        hideLoginModal();
        clearAuthErrors();
        updateHeaderUI(user);
        
        // Redirect admin to dashboard
        if (user.role === 'admin') {
            window.location.href = 'dashboard.html';
        }
        return;
    }
    
    // NOT LOGGED IN - Show modal
    showLoginModal();
    disablePageScroll();
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
        // Auto-hide after 5 seconds
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
// Called from form onsubmit in HTML
function handleLoginSubmit(event) {
    event.preventDefault();
    
    const identifier = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    // Validate
    if (!identifier || !password) {
        showError('Vui lòng nhập đầy đủ số điện thoại/email và mật khẩu');
        return false;
    }

    performLogin(identifier, password);
    return false;
}

function performLogin(identifier, password) {
    const errorEl = document.querySelector('.auth-error-message');
    if (errorEl) errorEl.style.display = 'none';
    
    // CALL LOGIN API
    fetch('http://localhost/btlWebbanhang/api/index.php?controller=auth&action=login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            //  Save to localStorage
            localStorage.setItem('auth_token', result.data.token);
            localStorage.setItem('auth_user', JSON.stringify(result.data.user));
            
            // Update UI without reload
            updateHeaderUI(result.data.user);
            hideLoginModal();
            enablePageScroll();
            clearAuthErrors();
            
            if (result.data.user.role === 'admin') {
                window.location.href = 'dashboard.html';
                return;
            }
            
            // Show success message (optional)
            console.log(' Đăng nhập thành công!');
            
        } else {
            showError(result.message || 'Đăng nhập thất bại');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showError('Lỗi kết nối: ' + error.message);
    });
}

// ===== HANDLE REGISTER FORM SUBMISSION =====
// Called from form onsubmit in HTML
function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('registerFullname').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    
    // Validate
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

function performRegister(fullname, phone, password, email) {
    const errorEl = document.querySelector('.auth-error-message');
    if (errorEl) errorEl.style.display = 'none';
    
    // CALL REGISTER API
    fetch('http://localhost/btlWebbanhang/api/index.php?controller=auth&action=register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullname, phone, password, email })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // ✅ Switch to login tab first for a smooth UX
            switchToLogin();

            // Clear register inputs safely (no form reset to avoid runtime errors)
            const registerFields = [
                'registerFullname',
                'registerPhone',
                'registerEmail',
                'registerPassword',
                'registerConfirmPassword'
            ];

            registerFields.forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            clearAuthErrors();

            // Show success message
            showError('Đăng ký thành công!');

        } else {
            showError(result.message || 'Đăng ký thất bại');
        }
    })
    .catch(error => {
        console.error('Register error:', error);
        showError('Lỗi kết nối: ' + error.message);
    });
}

// ===== SWITCH BETWEEN LOGIN/REGISTER TABS =====
function switchToLogin() {
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
    
    // HTML structure for logged-in state
    userActions.innerHTML = `
        <div class="user-menu-wrapper">
            <div class="user-greeting">
                <i class="fa-light fa-user-circle"></i>
                <span class="greeting-text">${user.fullname || 'Tài khoản'}</span>
                <i class="fa-light fa-caret-down"></i>
            </div>
            
            <div class="user-dropdown-menu">
                <a href="javascript:void(0)" class="user-menu-item" onclick="viewProfile()">
                    <i class="fa-light fa-user"></i> Thông tin tài khoản
                </a>
                <a href="javascript:void(0)" class="user-menu-item" onclick="changePassword()">
                    <i class="fa-light fa-key"></i> Đổi mật khẩu
                </a>
                <a href="history.html" class="user-menu-item">
                    <i class="fa-light fa-history"></i> Lịch sử mua hàng
                </a>
                <div class="user-menu-divider"></div>
                <a href="javascript:void(0)" class="user-menu-item logout-item" onclick="logout()">
                    <i class="fa-light fa-right-from-bracket"></i> Đăng xuất
                </a>
            </div>
        </div>
    `;
    
    // Add click handler for dropdown
    const userGreeting = document.querySelector('.user-greeting');
    if (userGreeting) {
        userGreeting.addEventListener('click', toggleUserDropdown);
    }
}

// ===== TOGGLE USER DROPDOWN MENU =====
function toggleUserDropdown(e) {
    const menu = document.querySelector('.user-dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// ===== USER PROFILE ACTIONS =====
function viewProfile() {
    const user = JSON.parse(localStorage.getItem('auth_user'));
    console.log('User profile:', user);
    alert(`Tên: ${user.fullname}\nSố điện thoại: ${user.phone}\nEmail: ${user.email || 'Chưa cập nhật'}`);
}

function changePassword() {
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if (!newPassword || newPassword.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    const oldPassword = prompt('Nhập mật khẩu hiện tại:');
    if (!oldPassword) return;
    
    const token = localStorage.getItem('auth_token');
    
    fetch('http://localhost/btlWebbanhang/api/index.php?controller=auth&action=change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Đổi mật khẩu thành công!');
        } else {
            alert('❌ ' + (result.message || 'Đổi mật khẩu thất bại'));
        }
    })
    .catch(error => {
        console.error('Password change error:', error);
        alert('Lỗi kết nối: ' + error.message);
    });
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = 'index.html';
    }
}

// ===== INIT AUTH ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
});
