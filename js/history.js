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

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const result = await response.json();
    if (!result.success) {
        const error = new Error(result.message || 'API Error');
        error.code = result.code;
        throw error;
    }
    return result.data;
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
                        <strong>${escapeHtml(order.customer_address)}</strong>
                    </div>
                    <div class="order-field">
                        <span>Thanh toán</span>
                        <strong>${escapeHtml(order.payment_method || 'COD')} - Thanh toán khi nhận hàng</strong>
                    </div>
                    <div class="order-field">
                        <span>Tổng tiền</span>
                        <div class="order-price">${currency.format(order.total_amount)}</div>
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

    try {
        allOrders = await requestJson(`${HISTORY_API_BASE}/history.php`);
        setMessage('');
        renderOrders();
    } catch (error) {
        if (error.code === 401) {
            window.location.href = 'index.html';
            return;
        }
        setMessage(`Lỗi: ${escapeHtml(error.message)}`);
    }
}

async function showOrderDetail(orderId) {
    try {
        const order = await requestJson(`${HISTORY_API_BASE}/detail.php?id=${encodeURIComponent(orderId)}`);
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
            <p><strong>Địa chỉ:</strong> ${escapeHtml(order.customer_address)}</p>
            <p><strong>Thanh toán:</strong> ${escapeHtml(order.payment_method || 'COD')}</p>
            <p><strong>Ghi chú:</strong> ${escapeHtml(order.notes || '')}</p>
            <ul class="detail-items">${itemsHtml}</ul>
            <p><strong>Phí giao hàng:</strong> ${currency.format(order.shipping_fee || 0)}</p>
            <p><strong>Tổng tiền:</strong> ${currency.format(order.total_amount)}</p>
        `;
        document.getElementById('orderDetailModal').classList.add('open');
    } catch (error) {
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
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
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
