const CHECKOUT_ORDER_API = 'api/checkout/create-order.php';
const CHECKOUT_COUPON_API = 'api/coupons/apply.php';
const CHECKOUT_PROFILE_API = `${window.APP_API_URL}?controller=auth&action=profile`;
const CHECKOUT_DEFAULT_AVATAR = 'assets/img/avt_mac_dinh.jpg';
const CHECKOUT_FALLBACK_IMAGE = 'assets/img/vy-food.png';
const CHECKOUT_SHIPPING_FEE = 25000;
const PICKUP_ADDRESS_DEFAULTS = {
    address: 'U8-I82, khu đô thị Đô Nghĩa',
    province: 'thành phố Hà Nội',
    ward: 'Phường Yên Nghĩa'
};
const checkoutMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const checkoutState = {
    user: null,
    cart: [],
    deliveryType: 'delivery',
    deliveryTimeType: 'asap',
    paymentMethod: 'cod',
    deliveryAddressDraft: null,
    appliedCoupon: null,
    totals: {
        subtotal: 0,
        base_shipping_fee: CHECKOUT_SHIPPING_FEE,
        shipping_fee: CHECKOUT_SHIPPING_FEE,
        discount_amount: 0,
        final_amount: CHECKOUT_SHIPPING_FEE
    }
};

function formatMoney(amount) {
    return checkoutMoney.format(Number(amount || 0));
}

function safeJsonParse(value, fallback = []) {
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
}

function checkoutCartKey(userId) {
    return `shoppingCart:${userId}`;
}

function normalizeCart(items) {
    return items
        .map((item) => ({
            product_id: Number(item.product_id || item.id),
            id: Number(item.product_id || item.id),
            title: item.title || item.name || 'Sản phẩm',
            price: Number(item.price || 0),
            image_url: item.image_url || item.img || CHECKOUT_FALLBACK_IMAGE,
            quantity: Math.max(1, Number(item.quantity || 1)),
            note: item.note || ''
        }))
        .filter((item) => item.product_id > 0 && item.quantity > 0);
}

function getCartForUser(userId) {
    const scopedKey = checkoutCartKey(userId);
    const scopedCart = normalizeCart(safeJsonParse(localStorage.getItem(scopedKey)));

    if (scopedCart.length > 0) {
        return scopedCart;
    }

    const legacyCart = normalizeCart(safeJsonParse(localStorage.getItem('shoppingCart')));
    if (legacyCart.length > 0) {
        localStorage.setItem(scopedKey, JSON.stringify(legacyCart));
        return legacyCart;
    }

    return [];
}

function saveCartForUser() {
    if (!checkoutState.user?.id) return;
    localStorage.setItem(checkoutCartKey(checkoutState.user.id), JSON.stringify(checkoutState.cart));
}

function clearCartForUser() {
    if (checkoutState.user?.id) {
        localStorage.removeItem(checkoutCartKey(checkoutState.user.id));
    }
    localStorage.removeItem('shoppingCart');
}

async function requestData(url, options = {}) {
    const result = await apiFetch(url, options);
    return result.data;
}

function setMessage(id, message = '', type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = `checkout-message ${type}`;
}

function localTotals() {
    const subtotal = checkoutState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const baseShipping = checkoutState.deliveryType === 'delivery' ? CHECKOUT_SHIPPING_FEE : 0;

    return {
        subtotal,
        base_shipping_fee: baseShipping,
        shipping_fee: baseShipping,
        discount_amount: 0,
        final_amount: subtotal + baseShipping
    };
}

function syncTotals(totals = localTotals()) {
    checkoutState.totals = {
        subtotal: Number(totals.subtotal || 0),
        base_shipping_fee: Number(totals.base_shipping_fee ?? totals.shipping_fee ?? 0),
        shipping_fee: Number(totals.shipping_fee || 0),
        discount_amount: Number(totals.discount_amount || 0),
        final_amount: Number(totals.final_amount || 0)
    };

    document.getElementById('subtotalAmount').textContent = formatMoney(checkoutState.totals.subtotal);
    document.getElementById('shippingAmount').textContent = checkoutState.totals.shipping_fee === 0
        ? 'Miễn phí'
        : formatMoney(checkoutState.totals.shipping_fee);
    document.getElementById('discountAmount').textContent = `-${formatMoney(checkoutState.totals.discount_amount)}`;
    document.getElementById('finalAmount').textContent = formatMoney(checkoutState.totals.final_amount);
}

function resetCoupon(message = '') {
    checkoutState.appliedCoupon = null;
    syncTotals(localTotals());
    if (message) {
        setMessage('couponMessage', message, 'info');
    } else {
        setMessage('couponMessage');
    }
}

function updateCartCount() {
    const count = checkoutState.cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
    document.querySelectorAll('.count-product-cart').forEach((el) => {
        el.textContent = count;
    });
}

function renderSummaryItems() {
    const container = document.getElementById('summaryItems');

    container.innerHTML = checkoutState.cart.map((item) => {
        const lineTotal = item.price * item.quantity;
        const image = item.image_url || CHECKOUT_FALLBACK_IMAGE;

        return `
            <div class="summary-item">
                <img class="summary-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" onerror="this.src='${CHECKOUT_FALLBACK_IMAGE}'">
                <div class="summary-info">
                    <h3 class="summary-name">${escapeHtml(item.title)}</h3>
                    <span class="summary-meta">Số lượng: ${item.quantity} x ${formatMoney(item.price)}</span>
                    ${item.note ? `<span class="summary-note">Ghi chú: ${escapeHtml(item.note)}</span>` : ''}
                </div>
                <strong class="summary-line-total">${formatMoney(lineTotal)}</strong>
            </div>
        `;
    }).join('');
}

function renderCheckoutState() {
    const isEmpty = checkoutState.cart.length === 0;

    document.getElementById('emptyCheckout').hidden = !isEmpty;
    document.getElementById('checkoutLayout').hidden = isEmpty;
    updateCartCount();

    if (isEmpty) {
        return;
    }

    renderSummaryItems();
    resetCoupon();
}

function hydratePendingCoupon() {
    const pendingCode = sessionStorage.getItem('checkout_coupon_code')
        || localStorage.getItem('checkout_coupon_code')
        || '';
    const couponInput = document.getElementById('couponCode');

    if (!pendingCode || !couponInput) return;

    couponInput.value = pendingCode;
    sessionStorage.removeItem('checkout_coupon_code');
    localStorage.removeItem('checkout_coupon_code');

    if (checkoutState.cart.length > 0) {
        applyCoupon();
    } else {
        setMessage('couponMessage', 'Mã giảm giá đã được điền. Hãy thêm món để áp dụng.', 'info');
    }
}

function splitSavedAddress(address) {
    const parts = String(address || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length >= 4) {
        return {
            address: parts.slice(0, -3).join(', '),
            ward: parts[parts.length - 3],
            province: parts[parts.length - 1]
        };
    }

    if (parts.length >= 3) {
        return {
            address: parts.slice(0, -2).join(', '),
            ward: parts[parts.length - 2],
            province: parts[parts.length - 1]
        };
    }

    return {
        address: address || '',
        ward: '',
        province: ''
    };
}

function fillUserInfo(user) {
    const address = splitSavedAddress(user.address || '');

    document.getElementById('customerName').value = user.fullname || '';
    document.getElementById('customerPhone').value = user.phone || '';
    document.getElementById('customerEmail').value = user.email || '';
    document.getElementById('customerAddress').value = address.address;
    document.getElementById('customerWard').value = address.ward;
    document.getElementById('customerProvince').value = address.province;

    if (checkoutState.deliveryType === 'pickup') {
        checkoutState.deliveryAddressDraft = readAddressFields();
        writeAddressFields(PICKUP_ADDRESS_DEFAULTS);
        setAddressFieldsReadonly(true);
    }
}

function updateHeaderUser(user) {
    const avatar = document.getElementById('checkoutHeaderAvatar');
    const name = document.getElementById('checkoutHeaderName');
    const avatarUrl = user.avatar_url || CHECKOUT_DEFAULT_AVATAR;

    if (avatar) {
        avatar.src = avatarUrl;
        avatar.alt = user.fullname || 'Tài khoản';
        avatar.addEventListener('error', () => {
            avatar.src = CHECKOUT_DEFAULT_AVATAR;
        }, { once: true });
    }

    if (name) {
        name.textContent = user.fullname || user.phone || 'Tài khoản';
    }
}

async function requireLoginAndLoadUser() {
    if (!isLoggedIn()) {
        clearAuth();
        window.location.href = 'index.html';
        return null;
    }

    try {
        const user = await requestData(CHECKOUT_PROFILE_API);
        checkoutState.user = user;
        localStorage.setItem('auth_user', JSON.stringify(user));
        updateHeaderUser(user);
        fillUserInfo(user);
        return user;
    } catch (error) {
        if (isAuthError(error)) {
            clearAuth();
            window.location.href = 'index.html';
            return null;
        }

        const cachedUser = getCurrentUser();
        if (cachedUser) {
            checkoutState.user = cachedUser;
            updateHeaderUser(cachedUser);
            fillUserInfo(cachedUser);
            setMessage('checkoutMessage', 'Không thể tải hồ sơ mới nhất, tạm dùng thông tin đã lưu.', 'info');
            return cachedUser;
        }

        setMessage('checkoutMessage', error.message || 'Không thể kiểm tra phiên đăng nhập.');
        return null;
    }
}

function updateDeliveryUi() {
    document.querySelectorAll('[data-delivery-tab]').forEach((label) => {
        label.classList.toggle('active', label.dataset.deliveryTab === checkoutState.deliveryType);
    });

    const isDelivery = checkoutState.deliveryType === 'delivery';
    document.getElementById('deliveryOptions').hidden = !isDelivery;
    document.getElementById('pickupNote').hidden = isDelivery;
}

function readAddressFields() {
    return {
        address: document.getElementById('customerAddress').value.trim(),
        province: document.getElementById('customerProvince').value.trim(),
        ward: document.getElementById('customerWard').value.trim()
    };
}

function writeAddressFields(values) {
    document.getElementById('customerAddress').value = values.address || '';
    document.getElementById('customerProvince').value = values.province || '';
    document.getElementById('customerWard').value = values.ward || '';
}

function setAddressFieldsReadonly(isReadonly) {
    ['customerAddress', 'customerProvince', 'customerWard'].forEach((id) => {
        const field = document.getElementById(id);
        field.readOnly = isReadonly;
        field.setAttribute('aria-readonly', String(isReadonly));
    });
}

function applyDeliveryTypeAddress() {
    if (checkoutState.deliveryType === 'pickup') {
        if (!checkoutState.deliveryAddressDraft) {
            checkoutState.deliveryAddressDraft = readAddressFields();
        }
        writeAddressFields(PICKUP_ADDRESS_DEFAULTS);
        setAddressFieldsReadonly(true);
        return;
    }

    setAddressFieldsReadonly(false);

    if (checkoutState.deliveryAddressDraft) {
        writeAddressFields(checkoutState.deliveryAddressDraft);
        checkoutState.deliveryAddressDraft = null;
    }
}

function updateDeliveryTimeUi() {
    document.querySelectorAll('.delivery-option').forEach((label) => {
        const input = label.querySelector('input[type="radio"]');
        label.classList.toggle('active', input?.checked);
    });
}

function updatePaymentUi() {
    document.querySelectorAll('.payment-option').forEach((label) => {
        const input = label.querySelector('input[type="radio"]');
        label.classList.toggle('active', input?.checked);
    });
}

function todayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDeliverySchedule() {
    if (checkoutState.deliveryType === 'pickup') {
        return {
            delivery_date: todayDateString(),
            delivery_time: 'pickup'
        };
    }

    if (checkoutState.deliveryTimeType === 'scheduled') {
        const value = document.getElementById('scheduledTime').value;
        if (value) {
            const [date, time] = value.split('T');
            return {
                delivery_date: date || todayDateString(),
                delivery_time: time || 'scheduled'
            };
        }
    }

    return {
        delivery_date: todayDateString(),
        delivery_time: 'asap'
    };
}

function getItemsPayload() {
    return checkoutState.cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        note: item.note || ''
    }));
}

function couponPayload() {
    return {
        coupon_code: document.getElementById('couponCode').value.trim(),
        delivery_type: checkoutState.deliveryType,
        items: getItemsPayload()
    };
}

async function applyCoupon(options = {}) {
    const couponCode = document.getElementById('couponCode').value.trim();
    const button = document.getElementById('applyCouponBtn');

    if (!couponCode) {
        resetCoupon('Vui lòng nhập mã giảm giá.');
        return false;
    }

    if (checkoutState.cart.length === 0) {
        resetCoupon('Giỏ hàng đang trống.');
        return false;
    }

    try {
        button.disabled = true;
        setMessage('couponMessage', 'Đang kiểm tra mã giảm giá...', 'info');

        const data = await requestData(CHECKOUT_COUPON_API, {
            method: 'POST',
            body: JSON.stringify(couponPayload())
        });

        checkoutState.appliedCoupon = data.coupon;
        syncTotals(data);
        setMessage('couponMessage', 'Áp dụng mã giảm giá thành công.', 'success');
        return true;
    } catch (error) {
        checkoutState.appliedCoupon = null;
        syncTotals(localTotals());

        if (isAuthError(error)) {
            clearAuth();
            window.location.href = 'index.html';
            return false;
        }

        setMessage('couponMessage', error.message || 'Mã giảm giá không hợp lệ.');
        return false;
    } finally {
        button.disabled = false;
        if (options.silent) {
            setMessage('couponMessage');
        }
    }
}

function validateCheckoutForm() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const province = document.getElementById('customerProvince').value.trim();
    const ward = document.getElementById('customerWard').value.trim();
    const email = document.getElementById('customerEmail').value.trim();

    if (!name || !phone || !address || !province || !ward) {
        throw new Error('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
    }

    if (!/^(0|\+84)[1-9][0-9]{8,9}$/.test(phone)) {
        throw new Error('Số điện thoại không đúng định dạng.');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Email không đúng định dạng.');
    }

    if (checkoutState.cart.length === 0) {
        throw new Error('Giỏ hàng đang trống.');
    }
}

function buildOrderPayload() {
    const schedule = getDeliverySchedule();
    const couponCode = checkoutState.appliedCoupon ? document.getElementById('couponCode').value.trim() : '';
    const shouldSaveInfo = checkoutState.deliveryType === 'delivery' && document.getElementById('saveInfo').checked;

    return {
        customer_name: document.getElementById('customerName').value.trim(),
        customer_phone: document.getElementById('customerPhone').value.trim(),
        email: document.getElementById('customerEmail').value.trim(),
        customer_address: document.getElementById('customerAddress').value.trim(),
        province: document.getElementById('customerProvince').value.trim(),
        ward: document.getElementById('customerWard').value.trim(),
        delivery_type: checkoutState.deliveryType,
        delivery_date: schedule.delivery_date,
        delivery_time: schedule.delivery_time,
        payment_method: checkoutState.paymentMethod,
        coupon_code: couponCode,
        notes: document.getElementById('orderNotes').value.trim(),
        vat_invoice: document.getElementById('vatInvoice').checked,
        save_info: shouldSaveInfo,
        items: getItemsPayload()
    };
}

async function placeOrder() {
    const button = document.getElementById('placeOrderBtn');
    const couponInputValue = document.getElementById('couponCode').value.trim();

    try {
        validateCheckoutForm();

        if (couponInputValue && !checkoutState.appliedCoupon) {
            const applied = await applyCoupon();
            if (!applied) return;
        }

        button.disabled = true;
        setMessage('checkoutMessage', 'Đang tạo đơn hàng...', 'info');

        const data = await requestData(CHECKOUT_ORDER_API, {
            method: 'POST',
            body: JSON.stringify(buildOrderPayload())
        });

        clearCartForUser();
        checkoutState.cart = [];
        updateCartCount();

        const pointsText = data.points_earned > 0 ? ` Bạn được cộng ${data.points_earned} điểm.` : '';
        setMessage('checkoutMessage', `Đặt hàng thành công.${pointsText}`, 'success');

        window.setTimeout(() => {
            window.location.href = 'history.html';
        }, 800);
    } catch (error) {
        if (isAuthError(error)) {
            clearAuth();
            window.location.href = 'index.html';
            return;
        }

        setMessage('checkoutMessage', error.message || 'Không thể đặt hàng.');
    } finally {
        button.disabled = false;
    }
}

function setupControls() {
    document.querySelectorAll('input[name="delivery_type"]').forEach((input) => {
        input.addEventListener('change', () => {
            checkoutState.deliveryType = input.value;
            applyDeliveryTypeAddress();
            updateDeliveryUi();
            resetCoupon('Tổng tiền đã cập nhật. Vui lòng áp dụng lại mã nếu cần.');
        });
    });

    document.querySelectorAll('input[name="delivery_time_type"]').forEach((input) => {
        input.addEventListener('change', () => {
            checkoutState.deliveryTimeType = input.value;
            updateDeliveryTimeUi();
        });
    });

    document.querySelectorAll('input[name="payment_method"]').forEach((input) => {
        input.addEventListener('change', () => {
            checkoutState.paymentMethod = input.value;
            updatePaymentUi();
        });
    });

    document.getElementById('applyCouponBtn').addEventListener('click', () => applyCoupon());
    document.getElementById('couponCode').addEventListener('input', () => {
        if (checkoutState.appliedCoupon) {
            resetCoupon('Mã giảm giá đã thay đổi. Vui lòng áp dụng lại.');
        }
    });
    document.getElementById('couponCode').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyCoupon();
        }
    });
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);

    const scheduledTime = document.getElementById('scheduledTime');
    if (scheduledTime) {
        scheduledTime.min = `${todayDateString()}T00:00`;
    }
}

function checkoutLogout() {
    clearAuth();
    window.location.href = 'index.html';
}

function setupUserMenu() {
    const wrapper = document.querySelector('.checkout-user-actions');
    const chip = document.querySelector('.checkout-user-chip');

    if (!wrapper || !chip) return;

    const closeMenu = () => {
        wrapper.classList.remove('open');
        chip.setAttribute('aria-expanded', 'false');
    };

    const toggleMenu = (event) => {
        event.stopPropagation();
        const isOpen = wrapper.classList.toggle('open');
        chip.setAttribute('aria-expanded', String(isOpen));
    };

    chip.addEventListener('click', toggleMenu);
    chip.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMenu(event);
        }
    });

    document.addEventListener('click', (event) => {
        if (!wrapper.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });
}

window.checkoutLogout = checkoutLogout;

document.addEventListener('DOMContentLoaded', async () => {
    setupControls();
    setupUserMenu();

    const user = await requireLoginAndLoadUser();
    if (!user) return;

    checkoutState.cart = getCartForUser(user.id);
    saveCartForUser();
    renderCheckoutState();
    hydratePendingCoupon();
});
