const HISTORY_API_BASE = 'http://localhost/btlWebbanhang/api/orders';
const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

let allOrders = [];
let activeFilter = 'all';

async function requestJson(url, options = {}) {
    const result = await apiFetch(url, options);
    return result.data;
}

function redirectToLogin() {
    clearAuth();
    window.location.href = 'index.html';
}

function setMessage(message) {
    document.getElementById('historyMessage').innerHTML = message;
}

function formatDate(value) {
    if (!value) return '';
    return new Date(value.replace(' ', 'T')).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function renderStatus(status) {
    return `<span class="status-pill status-${status}">${statusLabels[status] || status}</span>`;
}

function normalizeFilterStatus(status) {
    return status === 'delivered' ? 'completed' : status;
}

function getVisibleOrders() {
    if (activeFilter === 'all') return allOrders;
    return allOrders.filter((order) => normalizeFilterStatus(order.status) === activeFilter);
}

function getPrimaryItem(order) {
    return (order.items && order.items[0]) || {};
}

function renderItemsPreview(order) {
    const items = order.items || [];
    if (!items.length) return 'Không có món trong đơn';
    return items
        .slice(0, 3)
        .map((item) => `${escapeHtml(item.title || 'Món ăn')} (${item.quantity}x)`)
        .join('<br>');
}

function formatAddress(address) {
    const value = String(address || '').trim();
    const normalized = value
        .toLocaleLowerCase('vi-VN')
        .replace(/\s+/g, ' ');

    if (normalized === 'u8-i82, khu đô thị đô nghĩa, phường yên nghĩa, thành phố hà nội') {
        return 'U8-I82, khu đô thị Đô Nghĩa, Phường Yên Nghĩa, thành phố Hà Nội';
    }

    return value;
}

function getOrderSubtotal(order) {
    return (order.items || []).reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
}

function getOrderFinalAmount(order) {
    return Number(order.final_amount ?? order.total_amount ?? 0);
}

function getOrderBaseShipping(order, subtotal, finalAmount, discountAmount) {
    if (discountAmount > 0) {
        return Math.max(0, finalAmount + discountAmount - subtotal);
    }

    return Number(order.shipping_fee || 0);
}

function renderOrderCouponField(order) {
    const discountAmount = Number(order.discount_amount || 0);
    const couponCode = order.coupon_code ? String(order.coupon_code) : '';

    if (!couponCode && discountAmount <= 0) {
        return '';
    }

    const discountText = discountAmount > 0 ? ` - Giảm ${currency.format(discountAmount)}` : '';

    return `
        <div class="order-field order-discount-field">
            <span>Mã giảm giá</span>
            <strong>${couponCode ? escapeHtml(couponCode) : 'Đã áp dụng'}${discountText}</strong>
        </div>
    `;
}

function renderEmptyState() {
    const text = activeFilter === 'all'
        ? 'Bạn chưa có đơn hàng nào'
        : 'Không có đơn hàng phù hợp với bộ lọc này';

    return `
        <div class="history-empty">
            <div>
                <div class="history-empty-illustration">
                    <i class="fa-solid fa-receipt"></i>
                </div>
                <h2>${text}</h2>
                <p>Khám phá thực đơn VY FOOD và đặt món yêu thích của bạn.</p>
                <a href="index.html" class="history-btn solid">Đặt món ngay</a>
            </div>
        </div>
    `;
}

function renderOrders() {
    const list = document.getElementById('ordersList');
    const orders = getVisibleOrders();

    if (!orders.length) {
        list.innerHTML = renderEmptyState();
        return;
    }

    list.innerHTML = orders.map((order) => {
        const primaryItem = getPrimaryItem(order);
        const image = order.thumbnail || primaryItem.image_url || './assets/img/vy-food.png';
        const title = primaryItem.title || `Đơn hàng #${order.id}`;
        const totalItems = Number(order.total_items || 0);

        return `
            <article class="order-card">
                <div class="order-card-top">
                    <div>
                        <div class="order-code">Mã đơn: VY-${String(order.id).padStart(7, '0')}</div>
                        <div class="order-date">${formatDate(order.created_at)}</div>
                    </div>
                    ${renderStatus(order.status)}
                </div>

                <div class="order-food">
                    <img class="order-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(title)}">
                    <div>
                        <h2 class="order-title">${escapeHtml(title)}</h2>
                        <p class="order-items-preview">${renderItemsPreview(order)}</p>
                    </div>
                </div>

                <div class="order-grid">
                    <div class="order-field">
                        <span>Tổng món</span>
                        <strong>${totalItems || (order.items || []).length} món</strong>
                    </div>
                    <div class="order-field">
                        <span>Địa chỉ giao hàng</span>
                        <strong>${escapeHtml(formatAddress(order.customer_address))}</strong>
                    </div>
                    <div class="order-field">
                        <span>Thanh toán</span>
                        <strong>${escapeHtml(order.payment_method || 'COD')} - Thanh toán khi nhận hàng</strong>
                    </div>
                    ${renderOrderCouponField(order)}
                    <div class="order-field">
                        <span>Tổng tiền</span>
                        <div class="order-price">${currency.format(getOrderFinalAmount(order))}</div>
                    </div>
                </div>

                <div class="history-actions">
                    <button class="history-btn primary" onclick="showOrderDetail(${order.id})">Xem chi tiết</button>
                    ${order.status === 'pending' ? `<button class="history-btn danger" onclick="cancelOrder(${order.id})">Hủy đơn</button>` : '<span></span>'}
                </div>
            </article>
        `;
    }).join('');
}

async function loadHistory() {
    const list = document.getElementById('ordersList');
    list.innerHTML = '';
    setMessage('Đang tải lịch sử mua hàng...');

    if (!isLoggedIn()) {
        redirectToLogin();
        return;
    }

    try {
        allOrders = await requestJson(`${HISTORY_API_BASE}/history.php`);
        setMessage('');
        renderOrders();
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }
        setMessage(`Lỗi: ${escapeHtml(error.message)}`);
    }
}

async function showOrderDetail(orderId) {
    try {
        const order = await requestJson(`${HISTORY_API_BASE}/detail.php?id=${encodeURIComponent(orderId)}`);
        const subtotal = getOrderSubtotal(order);
        const discountAmount = Number(order.discount_amount || 0);
        const couponCode = order.coupon_code ? String(order.coupon_code) : '';
        const finalAmount = getOrderFinalAmount(order);
        const shippingFee = getOrderBaseShipping(order, subtotal, finalAmount, discountAmount);
        const couponHtml = couponCode || discountAmount > 0
            ? `
                <p class="detail-coupon-code"><strong>Mã giảm giá:</strong> ${couponCode ? escapeHtml(couponCode) : 'Đã áp dụng'}</p>
                <p class="detail-discount"><strong>Giảm giá:</strong> -${currency.format(discountAmount)}</p>
            `
            : '';
        const itemsHtml = (order.items || []).map((item) => `
            <li class="detail-item">
                <img src="${escapeHtml(item.image_url || './assets/img/vy-food.png')}" alt="${escapeHtml(item.title)}">
                <span>${escapeHtml(item.title)} x ${item.quantity}</span>
                <strong>${currency.format(item.price * item.quantity)}</strong>
            </li>
        `).join('');

        document.getElementById('orderDetailBody').innerHTML = `
            <h2>Chi tiết đơn VY-${String(order.id).padStart(7, '0')}</h2>
            <p><strong>Trạng thái:</strong> ${statusLabels[order.status] || order.status}</p>
            <p><strong>Ngày đặt:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>Người nhận:</strong> ${escapeHtml(order.customer_name)} - ${escapeHtml(order.customer_phone)}</p>
            <p><strong>Địa chỉ:</strong> ${escapeHtml(formatAddress(order.customer_address))}</p>
            <p><strong>Thanh toán:</strong> ${escapeHtml(order.payment_method || 'COD')}</p>
            <p><strong>Ghi chú:</strong> ${escapeHtml(order.notes || '')}</p>
            <ul class="detail-items">${itemsHtml}</ul>
            <div class="detail-totals">
                <p><strong>Tạm tính:</strong> ${currency.format(subtotal)}</p>
                <p><strong>Phí giao hàng:</strong> ${shippingFee === 0 ? 'Miễn phí' : currency.format(shippingFee)}</p>
                ${couponHtml}
                <p class="detail-grand-total"><strong>Tổng thanh toán:</strong> ${currency.format(finalAmount)}</p>
            </div>
        `;
        document.getElementById('orderDetailModal').classList.add('open');
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }
        alert(error.message);
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    try {
        await requestJson(`${HISTORY_API_BASE}/cancel.php`, {
            method: 'POST',
            body: JSON.stringify({ id: orderId })
        });
        await loadHistory();
    } catch (error) {
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }
        alert(error.message);
    }
}

function setupTabs() {
    document.querySelectorAll('.history-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.history-tab').forEach((item) => item.classList.remove('active'));
            tab.classList.add('active');
            activeFilter = tab.dataset.filter;
            renderOrders();
        });
    });
}

function setupHeaderUser() {
    const user = getCurrentUser();
    const el = document.getElementById('historyUserName');
    if (el && user) {
        el.textContent = user.fullname || user.phone || '';
    }
}

document.getElementById('closeOrderDetail').addEventListener('click', () => {
    document.getElementById('orderDetailModal').classList.remove('open');
});

document.getElementById('orderDetailModal').addEventListener('click', (event) => {
    if (event.target.id === 'orderDetailModal') {
        event.currentTarget.classList.remove('open');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupHeaderUser();
    loadHistory();
});
