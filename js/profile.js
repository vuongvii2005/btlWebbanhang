const PROFILE_API_URL = 'api/profile.php';
const AUTH_LOGOUT_URL = `${window.APP_API_URL}?controller=auth&action=logout`;
const AUTH_CHANGE_PASSWORD_URL = `${window.APP_API_URL}?controller=auth&action=change-password`;
const DEFAULT_AVATAR = 'assets/img/avt_mac_dinh.jpg';
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AVATAR_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

const profileState = {
    user: null,
    stats: null,
    recentOrders: []
};

let selectedAvatarFile = null;
let avatarPreviewObjectUrl = '';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
});

const statusLabels = {
    pending: 'Đang chuẩn bị',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    completed: 'Đã giao',
    cancelled: 'Đã hủy'
};

function redirectToLogin() {
    clearAuth();
    window.location.href = 'index.html';
}

function setMessage(message = '', type = '') {
    const el = document.getElementById('profileMessage');
    if (!el) return;

    el.textContent = message;
    el.className = 'profile-message';

    if (message) {
        el.classList.add('show');
        if (type) el.classList.add(type);
    }
}

function getErrorMessage(error, fallback) {
    const errors = error?.errors || {};

    for (const field of Object.keys(errors)) {
        if (Array.isArray(errors[field]) && errors[field][0]) {
            return errors[field][0];
        }
    }

    return error?.message || fallback;
}

function formatDate(value, withTime = false) {
    if (!value) return '';

    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    });
}

function formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function getAvatarUrl(user) {
    return user?.avatar_url || DEFAULT_AVATAR;
}

function setImageSrc(image, src) {
    image.src = src || DEFAULT_AVATAR;
    image.onerror = () => {
        image.onerror = null;
        image.src = DEFAULT_AVATAR;
    };
}

function clearSelectedAvatarFile() {
    selectedAvatarFile = null;

    const avatarFile = document.getElementById('avatarFile');
    if (avatarFile) {
        avatarFile.value = '';
    }

    if (avatarPreviewObjectUrl) {
        URL.revokeObjectURL(avatarPreviewObjectUrl);
        avatarPreviewObjectUrl = '';
    }
}

function updateCartCount() {
    const countEl = document.querySelector('.count-product-cart');
    if (!countEl) return;

    try {
        const cart = JSON.parse(localStorage.getItem('shoppingCart') || '[]');
        countEl.textContent = cart.reduce((total, item) => total + Number(item.quantity || 1), 0);
    } catch (error) {
        countEl.textContent = '0';
    }
}

function updateHeaderUser(user) {
    const actions = document.querySelector('.user-actions');
    if (!actions) return;

    const avatarUrl = getAvatarUrl(user);

    actions.innerHTML = `
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
                <button class="user-menu-item logout-item profile-dropdown-logout" type="button">
                    <i class="fa-light fa-right-from-bracket"></i> Đăng xuất
                </button>
            </div>
        </div>
    `;

    actions.querySelector('.user-greeting')?.addEventListener('click', () => {
        const menu = actions.querySelector('.user-dropdown-menu');
        if (menu) {
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }
    });
    actions.querySelector('.profile-dropdown-logout')?.addEventListener('click', logoutProfile);
    actions.querySelectorAll('.header-user-avatar, .user-menu-avatar').forEach((avatar) => {
        avatar.addEventListener('error', () => {
            avatar.src = DEFAULT_AVATAR;
        });
    });
}

function fillProfileForm(user) {
    clearSelectedAvatarFile();

    document.getElementById('fullname').value = user.fullname || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('createdAt').value = formatDate(user.created_at);

    document.getElementById('sidebarName').textContent = user.fullname || 'Tài khoản';
    setImageSrc(document.getElementById('sidebarAvatar'), getAvatarUrl(user));
    setImageSrc(document.getElementById('avatarPreview'), getAvatarUrl(user));
}

function renderStats(stats = {}) {
    document.getElementById('totalOrders').textContent = formatNumber(stats.total_orders);
    document.getElementById('favoriteCount').textContent = formatNumber(stats.favorite_count);
    document.getElementById('rewardPoints').textContent = formatNumber(stats.points);
}

function renderRecentOrders(orders = []) {
    const body = document.getElementById('recentOrdersBody');

    if (!orders.length) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="profile-empty-row">Bạn chưa có đơn hàng gần đây.</td>
            </tr>
        `;
        return;
    }

    body.innerHTML = orders.map((order) => {
        const normalizedStatus = order.status === 'completed' ? 'delivered' : order.status;
        const images = (order.items || [])
            .slice(0, 2)
            .map((item) => `<img src="${escapeHtml(item.image_url || DEFAULT_AVATAR)}" alt="${escapeHtml(item.title || 'Món ăn')}">`)
            .join('');

        return `
            <tr>
                <td>#VF${String(order.id).padStart(5, '0')}</td>
                <td>${formatDate(order.created_at, true)}</td>
                <td>
                    <div class="profile-order-products">
                        ${images || `<img src="${DEFAULT_AVATAR}" alt="VY FOOD">`}
                        <span>${Number(order.item_count || 0)} món</span>
                    </div>
                </td>
                <td class="profile-price">${currencyFormatter.format(Number(order.total_amount || 0))}</td>
                <td><span class="profile-status ${escapeHtml(normalizedStatus)}">${statusLabels[normalizedStatus] || escapeHtml(order.status || '')}</span></td>
                <td><a class="profile-detail-link" href="history.html">Xem chi tiết</a></td>
            </tr>
        `;
    }).join('');
}

function renderProfile(payload) {
    profileState.user = payload.user || {};
    profileState.stats = payload.stats || {};
    profileState.recentOrders = payload.recent_orders || [];

    localStorage.setItem('auth_user', JSON.stringify(profileState.user));
    updateHeaderUser(profileState.user);
    fillProfileForm(profileState.user);
    renderStats(profileState.stats);
    renderRecentOrders(profileState.recentOrders);
}

async function loadProfile() {
    if (!isLoggedIn()) {
        redirectToLogin();
        return;
    }

    setMessage('Đang tải thông tin tài khoản...');

    try {
        const result = await apiFetch(PROFILE_API_URL);
        renderProfile(result.data);
        setMessage('');
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }

        setMessage(getErrorMessage(error, 'Không thể tải thông tin tài khoản.'), 'error');
    }
}

function getProfileFormData() {
    const data = {
        fullname: document.getElementById('fullname').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim()
    };

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
    });

    if (selectedAvatarFile) {
        formData.append('avatar_file', selectedAvatarFile);
    }

    return { data, formData };
}

async function saveProfile(event) {
    event.preventDefault();

    const { data, formData } = getProfileFormData();
    if (!data.fullname || !data.phone) {
        setMessage('Vui lòng nhập họ tên và số điện thoại.', 'error');
        return;
    }

    const button = document.getElementById('saveProfileBtn');
    button.disabled = true;
    button.innerHTML = '<i class="fa-light fa-spinner fa-spin"></i> Đang lưu...';

    try {
        const result = await apiFetch(PROFILE_API_URL, {
            method: 'POST',
            body: formData
        });

        renderProfile(result.data);
        setMessage('Cập nhật thông tin tài khoản thành công.', 'success');
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }

        setMessage(getErrorMessage(error, 'Cập nhật thông tin thất bại.'), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-light fa-floppy-disk"></i> Lưu thay đổi';
    }
}

function resetProfileForm() {
    if (profileState.user) {
        fillProfileForm(profileState.user);
        setMessage('Đã khôi phục thông tin ban đầu.');
    }
}

function isAllowedAvatarFile(file) {
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    return AVATAR_ALLOWED_TYPES.includes(file.type) && AVATAR_ALLOWED_EXTENSIONS.includes(extension);
}

function openAvatarPicker() {
    document.getElementById('avatarFile').click();
}

function handleAvatarSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!isAllowedAvatarFile(file)) {
        selectedAvatarFile = null;
        event.target.value = '';
        setMessage('Ảnh đại diện chỉ hỗ trợ JPG, JPEG, PNG, GIF hoặc WEBP.', 'error');
        return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
        selectedAvatarFile = null;
        event.target.value = '';
        setMessage('Ảnh đại diện không được vượt quá 2MB.', 'error');
        return;
    }

    selectedAvatarFile = file;

    if (avatarPreviewObjectUrl) {
        URL.revokeObjectURL(avatarPreviewObjectUrl);
    }

    avatarPreviewObjectUrl = URL.createObjectURL(file);
    setImageSrc(document.getElementById('avatarPreview'), avatarPreviewObjectUrl);
    setImageSrc(document.getElementById('sidebarAvatar'), avatarPreviewObjectUrl);
    setMessage('Đã chọn ảnh mới. Bấm "Lưu thay đổi" để cập nhật ảnh đại diện.');
}

function handleAvatarPickerKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAvatarPicker();
    }
}

async function logoutProfile() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;

    try {
        await apiFetch(AUTH_LOGOUT_URL, {
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

async function changePasswordFromProfile() {
    const oldPassword = prompt('Nhập mật khẩu hiện tại:');
    if (!oldPassword) return;

    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if (!newPassword || newPassword.length < 6) {
        setMessage('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
        return;
    }

    try {
        await apiFetch(AUTH_CHANGE_PASSWORD_URL, {
            method: 'POST',
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });
        setMessage('Đổi mật khẩu thành công.', 'success');
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }

        setMessage(getErrorMessage(error, 'Đổi mật khẩu thất bại.'), 'error');
    }
}

function setupProfileEvents() {
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('cancelProfileBtn').addEventListener('click', resetProfileForm);
    document.getElementById('logoutBtn').addEventListener('click', logoutProfile);
    document.getElementById('changePasswordBtn').addEventListener('click', changePasswordFromProfile);
    document.getElementById('favoriteBtn').addEventListener('click', () => {
        setMessage('Mục món yêu thích sẽ hiển thị dữ liệu khi bảng favorite_products được thêm.');
    });
    document.getElementById('focusAddressBtn').addEventListener('click', () => {
        document.getElementById('address').focus();
    });
    document.getElementById('avatarFocusBtn').addEventListener('click', openAvatarPicker);
    document.getElementById('avatarPreview').addEventListener('click', openAvatarPicker);
    document.getElementById('avatarPreview').addEventListener('keydown', handleAvatarPickerKeydown);
    document.getElementById('sidebarAvatar').addEventListener('click', openAvatarPicker);
    document.getElementById('sidebarAvatar').addEventListener('keydown', handleAvatarPickerKeydown);
    document.getElementById('avatarFile').addEventListener('change', handleAvatarSelected);
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    setupProfileEvents();
    loadProfile();
});
