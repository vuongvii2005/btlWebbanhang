const PROFILE_API_URL = 'api/profile.php';
const PROFILE_COUPONS_API = 'api/user/coupons.php';
const PROFILE_REDEEM_COUPON_API = 'api/user/redeem_coupon.php';
const PROFILE_FAVORITES_API = `${window.APP_API_URL}?controller=favorite`;
const AUTH_LOGOUT_URL = `${window.APP_API_URL}?controller=auth&action=logout`;
const AUTH_CHANGE_PASSWORD_URL = `${window.APP_API_URL}?controller=auth&action=change-password`;
const DEFAULT_AVATAR = 'assets/img/avt_mac_dinh.jpg';
const DEFAULT_PRODUCT_IMAGE = 'assets/img/vy-food.png';
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AVATAR_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

const profileState = {
    user: null,
    stats: null,
    recentOrders: [],
    favorites: {
        items: [],
        loaded: false
    },
    coupons: {
        points: 0,
        userCoupons: [],
        availableCoupons: [],
        activeTab: 'mine'
    }
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
        const user = getCurrentUser();
        const key = user?.id ? `shoppingCart:${user.id}` : 'shoppingCart';
        const cart = JSON.parse(localStorage.getItem(key) || '[]');
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

function getProductImageUrl(product = {}) {
    return product.image_url || DEFAULT_PRODUCT_IMAGE;
}

function getProductDetailUrl(productId) {
    return `index.html?product_id=${encodeURIComponent(productId)}`;
}

function updateFavoriteCount(count) {
    const normalizedCount = Math.max(0, Number(count || 0));
    const favoriteCount = document.getElementById('favoriteCount');

    if (!profileState.stats) {
        profileState.stats = {};
    }

    profileState.stats.favorite_count = normalizedCount;
    if (favoriteCount) favoriteCount.textContent = formatNumber(normalizedCount);
}

function setFavoritesLoading() {
    const list = document.getElementById('favoriteProductsList');
    if (!list) return;

    list.innerHTML = '<div class="favorite-loading">Đang tải món yêu thích...</div>';
}

function renderFavoritesEmpty() {
    const list = document.getElementById('favoriteProductsList');
    if (!list) return;

    list.innerHTML = `
        <div class="favorite-empty-state">
            <i class="fa-light fa-heart"></i>
            <strong>Bạn chưa có món yêu thích nào</strong>
            <span>Hãy bấm trái tim ở trang thực đơn để lưu lại những món bạn thích nhất.</span>
        </div>
    `;
}

function renderFavoritesError(message) {
    const list = document.getElementById('favoriteProductsList');
    if (!list) return;

    list.innerHTML = `
        <div class="favorite-empty-state">
            <i class="fa-light fa-circle-exclamation"></i>
            <strong>Chưa thể tải món yêu thích</strong>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
}

function bindFavoriteImageFallbacks() {
    document.querySelectorAll('#favoriteProductsList img').forEach((image) => {
        image.addEventListener('error', () => {
            image.src = DEFAULT_PRODUCT_IMAGE;
        });
    });
}

function renderFavoriteProducts(products = []) {
    const list = document.getElementById('favoriteProductsList');
    if (!list) return;

    if (!products.length) {
        renderFavoritesEmpty();
        return;
    }

    list.innerHTML = `
        <div class="favorite-products-grid">
            ${products.map((product) => {
                const productId = Number(product.id || 0);
                const detailUrl = getProductDetailUrl(productId);

                return `
                    <article class="favorite-product-card">
                        <a class="favorite-product-image" href="${escapeHtml(detailUrl)}" aria-label="Xem chi tiết ${escapeHtml(product.title || 'Món ăn')}">
                            <img src="${escapeHtml(getProductImageUrl(product))}" alt="${escapeHtml(product.title || 'Món ăn')}">
                        </a>
                        <div class="favorite-product-body">
                            <div>
                                <h3>${escapeHtml(product.title || 'Món ăn')}</h3>
                                ${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}
                            </div>
                            <strong class="favorite-product-price">${currencyFormatter.format(Number(product.price || 0))}</strong>
                            <div class="favorite-product-actions">
                                <a class="profile-btn light favorite-detail-link" href="${escapeHtml(detailUrl)}">
                                    <i class="fa-light fa-eye"></i>
                                    Xem chi tiết
                                </a>
                                <button class="profile-btn primary favorite-remove-btn" type="button" data-remove-favorite="${productId}">
                                    <i class="fa-light fa-heart-crack"></i>
                                    Bỏ yêu thích
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;

    bindFavoriteImageFallbacks();
}

async function loadFavorites() {
    if (!isLoggedIn()) {
        redirectToLogin();
        return;
    }

    setFavoritesLoading();

    try {
        const result = await apiFetch(`${PROFILE_FAVORITES_API}&action=list`);
        const favorites = Array.isArray(result.data) ? result.data : [];

        profileState.favorites.items = favorites;
        profileState.favorites.loaded = true;
        renderFavoriteProducts(favorites);
        updateFavoriteCount(favorites.length);
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }

        renderFavoritesError(getErrorMessage(error, 'Không thể tải danh sách món yêu thích.'));
        setMessage(getErrorMessage(error, 'Không thể tải danh sách món yêu thích.'), 'error');
    }
}

async function removeFavoriteProduct(productId, button) {
    if (!isLoggedIn()) {
        redirectToLogin();
        return;
    }

    const normalizedProductId = Number(productId || 0);
    if (!normalizedProductId) return;

    const originalHtml = button?.innerHTML || '';
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-light fa-spinner fa-spin"></i> Đang bỏ...';
    }

    try {
        const statusResult = await apiFetch(`${PROFILE_FAVORITES_API}&action=status&product_id=${encodeURIComponent(normalizedProductId)}`);
        if (!statusResult.data?.is_favorite) {
            profileState.favorites.items = profileState.favorites.items.filter(
                (product) => Number(product.id) !== normalizedProductId
            );
            renderFavoriteProducts(profileState.favorites.items);
            updateFavoriteCount(profileState.favorites.items.length);
            setMessage('Món này đã được bỏ khỏi danh sách yêu thích.', 'success');
            return;
        }

        const result = await apiFetch(`${PROFILE_FAVORITES_API}&action=toggle`, {
            method: 'POST',
            body: JSON.stringify({ product_id: normalizedProductId })
        });
        const isFavorite = Boolean(result.data?.is_favorite);

        if (isFavorite) {
            await loadFavorites();
            setMessage('Món này vẫn đang trong danh sách yêu thích.', 'error');
            return;
        }

        profileState.favorites.items = profileState.favorites.items.filter(
            (product) => Number(product.id) !== normalizedProductId
        );
        renderFavoriteProducts(profileState.favorites.items);
        updateFavoriteCount(profileState.favorites.items.length);
        setMessage('Đã bỏ món khỏi danh sách yêu thích.', 'success');
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }

        setMessage(getErrorMessage(error, 'Không thể cập nhật món yêu thích.'), 'error');
    } finally {
        if (button && button.isConnected) {
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }
}

function setupFavoriteEvents() {
    const section = document.getElementById('favoriteSection');
    if (!section) return;

    section.addEventListener('click', (event) => {
        const removeButton = event.target.closest('[data-remove-favorite]');
        if (!removeButton || removeButton.disabled) return;

        removeFavoriteProduct(Number(removeButton.dataset.removeFavorite), removeButton);
    });
}

function setCouponMessage(message = '', type = '') {
    const el = document.getElementById('couponProfileMessage');
    if (!el) return;

    el.textContent = message;
    el.className = 'coupon-profile-message';

    if (message) {
        el.classList.add('show');
        if (type) el.classList.add(type);
    }
}

function formatCouponDate(value) {
    return formatDate(value) || 'Không giới hạn';
}

function formatCouponMoney(value) {
    return currencyFormatter.format(Number(value || 0));
}

function formatCouponBenefit(coupon = {}) {
    const type = coupon.discount_type;
    const value = Number(coupon.discount_value || 0);
    const maxDiscount = Number(coupon.max_discount_amount || 0);

    if (type === 'freeship') {
        return 'Miễn phí giao hàng';
    }

    if (type === 'percent') {
        return maxDiscount > 0
            ? `Giảm ${value}% tối đa ${formatCouponMoney(maxDiscount)}`
            : `Giảm ${value}%`;
    }

    return `Giảm ${formatCouponMoney(value)}`;
}

function formatCouponCondition(coupon = {}) {
    const minAmount = Number(coupon.min_order_amount || 0);
    return minAmount > 0 ? `Đơn từ ${formatCouponMoney(minAmount)}` : 'Không yêu cầu đơn tối thiểu';
}

function couponIconClass(coupon = {}) {
    if (coupon.discount_type === 'freeship') return 'fa-truck-fast';
    if (coupon.discount_type === 'percent') return 'fa-gift';
    return 'fa-badge-percent';
}

function renderCouponPoints(points = 0) {
    const formattedPoints = formatNumber(points);
    const couponPoints = document.getElementById('couponPoints');
    const rewardPoints = document.getElementById('rewardPoints');

    if (couponPoints) couponPoints.textContent = formattedPoints;
    if (rewardPoints) rewardPoints.textContent = formattedPoints;
}

function renderMyCoupons(coupons = []) {
    const list = document.getElementById('myCouponsList');
    if (!list) return;

    if (!coupons.length) {
        list.innerHTML = `
            <div class="coupon-empty-state">
                <i class="fa-light fa-ticket"></i>
                <strong>Bạn chưa có mã giảm giá nào</strong>
                <span>Hãy đổi điểm để nhận ưu đãi từ VY FOOD</span>
            </div>
        `;
        return;
    }

    list.innerHTML = `
        <div class="voucher-grid">
            ${coupons.map((coupon) => {
                const statusCode = coupon.status_code || 'expired';
                const canUse = Boolean(coupon.can_use);
                const code = coupon.coupon_code || coupon.code || '';

                return `
                    <article class="voucher-card ${escapeHtml(statusCode)}">
                        <div class="voucher-ribbon">
                            <i class="fa-light ${couponIconClass(coupon)}"></i>
                        </div>
                        <div class="voucher-body">
                            <div class="voucher-topline">
                                <strong class="voucher-code">${escapeHtml(code)}</strong>
                                <span class="voucher-status ${escapeHtml(statusCode)}">${escapeHtml(coupon.status_label || 'Hết hạn')}</span>
                            </div>
                            <h3>${escapeHtml(coupon.title || formatCouponBenefit(coupon))}</h3>
                            <p>${escapeHtml(coupon.description || `${formatCouponBenefit(coupon)} - ${formatCouponCondition(coupon)}`)}</p>
                            <div class="voucher-meta">
                                <span>${escapeHtml(formatCouponCondition(coupon))}</span>
                                <span>Hạn dùng: ${escapeHtml(formatCouponDate(coupon.expires_at))}</span>
                            </div>
                            <div class="voucher-actions">
                                <button class="voucher-btn light" type="button" data-copy-code="${escapeHtml(code)}">
                                    <i class="fa-light fa-copy"></i>
                                    Copy mã
                                </button>
                                <button class="voucher-btn primary" type="button" data-use-code="${escapeHtml(code)}" ${canUse ? '' : 'disabled'}>
                                    Dùng ngay
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function exchangeButtonLabel(coupon = {}) {
    if (coupon.redeem_status === 'sold_out') return 'Hết lượt';
    if (coupon.redeem_status === 'not_enough_points') return 'Không đủ điểm';
    if (coupon.redeem_status === 'limit_reached') return 'Đã đổi';
    return 'Đổi mã';
}

function renderExchangeCoupons(coupons = []) {
    const list = document.getElementById('exchangeCouponsList');
    if (!list) return;

    if (!coupons.length) {
        list.innerHTML = `
            <div class="coupon-empty-state">
                <i class="fa-light fa-gift"></i>
                <strong>Hiện chưa có mã có thể đổi</strong>
                <span>VY FOOD sẽ cập nhật ưu đãi mới trong thời gian tới</span>
            </div>
        `;
        return;
    }

    list.innerHTML = `
        <div class="exchange-grid">
            ${coupons.map((coupon) => {
                const canRedeem = Boolean(coupon.can_redeem);

                return `
                    <article class="exchange-card">
                        <span class="exchange-icon">
                            <i class="fa-light ${couponIconClass(coupon)}"></i>
                        </span>
                        <div class="exchange-content">
                            <h3>${escapeHtml(coupon.title || formatCouponBenefit(coupon))}</h3>
                            <p>${escapeHtml(coupon.description || formatCouponCondition(coupon))}</p>
                            <div class="exchange-meta">
                                <span>Cần ${formatNumber(coupon.points_required)} điểm</span>
                                <span>${escapeHtml(formatCouponCondition(coupon))}</span>
                                ${coupon.usage_limit ? `<span>Đã đổi ${formatNumber(coupon.redeemed_count || 0)}/${formatNumber(coupon.usage_limit)} lượt</span>` : ''}
                                <span>Hạn đổi: ${escapeHtml(formatCouponDate(coupon.end_date))}</span>
                            </div>
                        </div>
                        <button class="voucher-btn primary exchange-redeem-btn" type="button" data-redeem-coupon="${Number(coupon.id)}" ${canRedeem ? '' : 'disabled'}>
                            ${exchangeButtonLabel(coupon)}
                        </button>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function renderCouponTabs() {
    document.querySelectorAll('[data-coupon-tab]').forEach((button) => {
        const isActive = button.dataset.couponTab === profileState.coupons.activeTab;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
    });

    const myPanel = document.getElementById('myCouponsPanel');
    const exchangePanel = document.getElementById('exchangeCouponsPanel');
    const showExchange = profileState.coupons.activeTab === 'exchange';

    if (myPanel) {
        myPanel.hidden = showExchange;
        myPanel.classList.toggle('active', !showExchange);
    }

    if (exchangePanel) {
        exchangePanel.hidden = !showExchange;
        exchangePanel.classList.toggle('active', showExchange);
    }
}

function renderCoupons(payload = {}) {
    const points = Number(payload.points?.points || 0);
    profileState.coupons.points = points;
    profileState.coupons.userCoupons = payload.user_coupons || [];
    profileState.coupons.availableCoupons = payload.available_coupons || [];

    renderCouponPoints(points);
    renderMyCoupons(profileState.coupons.userCoupons);
    renderExchangeCoupons(profileState.coupons.availableCoupons);
    renderCouponTabs();
}

function setCouponsLoading() {
    document.getElementById('myCouponsList').innerHTML = '<div class="coupon-loading">Đang tải mã giảm giá...</div>';
    document.getElementById('exchangeCouponsList').innerHTML = '<div class="coupon-loading">Đang tải ưu đãi có thể đổi...</div>';
}

async function loadCoupons() {
    if (!isLoggedIn()) {
        redirectToLogin();
        return;
    }

    setCouponsLoading();

    try {
        const result = await apiFetch(PROFILE_COUPONS_API);
        renderCoupons(result.data || {});
        setCouponMessage('');
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }

        setCouponMessage(getErrorMessage(error, 'Không thể tải mã giảm giá.'), 'error');
        renderMyCoupons([]);
        renderExchangeCoupons([]);
    }
}

async function copyCouponCode(code) {
    if (!code) return;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }

        setCouponMessage(`Đã copy mã ${code}.`, 'success');
    } catch (error) {
        setCouponMessage('Không thể copy mã. Bạn có thể bôi đen và copy thủ công.', 'error');
    }
}

function useCouponNow(code) {
    if (!code) return;

    sessionStorage.setItem('checkout_coupon_code', code);
    localStorage.setItem('checkout_coupon_code', code);
    window.location.href = 'checkout.html';
}

async function redeemCoupon(couponId, button) {
    if (!couponId) return;

    const originalText = button?.textContent || 'Đổi mã';
    if (button) {
        button.disabled = true;
        button.textContent = 'Đang đổi...';
    }

    try {
        const result = await apiFetch(PROFILE_REDEEM_COUPON_API, {
            method: 'POST',
            body: JSON.stringify({ coupon_id: couponId })
        });
        const successMessage = result.message || 'Đổi mã giảm giá thành công.';

        await loadCoupons();
        profileState.coupons.activeTab = 'mine';
        renderCouponTabs();
        setCouponMessage(successMessage, 'success');
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }

        setCouponMessage(getErrorMessage(error, 'Không thể đổi mã giảm giá.'), 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

function setupCouponEvents() {
    const section = document.getElementById('couponSection');
    if (!section) return;

    section.addEventListener('click', (event) => {
        const tabButton = event.target.closest('[data-coupon-tab]');
        if (tabButton) {
            profileState.coupons.activeTab = tabButton.dataset.couponTab || 'mine';
            renderCouponTabs();
            return;
        }

        const copyButton = event.target.closest('[data-copy-code]');
        if (copyButton) {
            copyCouponCode(copyButton.dataset.copyCode);
            return;
        }

        const useButton = event.target.closest('[data-use-code]');
        if (useButton && !useButton.disabled) {
            useCouponNow(useButton.dataset.useCode);
            return;
        }

        const redeemButton = event.target.closest('[data-redeem-coupon]');
        if (redeemButton && !redeemButton.disabled) {
            redeemCoupon(Number(redeemButton.dataset.redeemCoupon), redeemButton);
        }
    });
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
    document.getElementById('couponSectionBtn').addEventListener('click', () => {
        const section = document.getElementById('couponSection');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
    document.getElementById('favoriteBtn').addEventListener('click', () => {
        const section = document.getElementById('favoriteSection');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (!profileState.favorites.loaded) {
            loadFavorites();
        }

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
    setupFavoriteEvents();
    setupCouponEvents();
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    setupProfileEvents();
    loadProfile();
    loadFavorites();
    loadCoupons();
});
