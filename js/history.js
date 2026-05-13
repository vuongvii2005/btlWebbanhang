const HISTORY_API_BASE = 'http://localhost/btlWebbanhang/api/orders';
const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

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
    return new Date(value.replace(' ', 'T')).toLocaleDateString('vi-VN');
}

function renderStatus(status) {
    return `<span class="status-pill status-${status}">${statusLabels[status] || status}</span>`;
}

async function loadHistory() {
    const list = document.getElementById('ordersList');
    list.innerHTML = '';
    setMessage('Đang tải lịch sử mua hàng...');

    try {
        const orders = await requestJson(`${HISTORY_API_BASE}/history.php`);

        if (!orders.length) {
            setMessage('Bạn chưa có đơn hàng nào');
            return;
        }

        setMessage('');
        list.innerHTML = orders.map((order) => `
            <article class="order-card">
                <div class="order-card-top">
                    <div>
                        <div class="order-code">Đơn #${order.id}</div>
                        <div class="order-date">Ngày đặt: ${formatDate(order.created_at)}</div>
                    </div>
                    ${renderStatus(order.status)}
                </div>

                <div class="order-grid">
                    <div class="order-field">
                        <span>Tổng tiền</span>
                        <strong>${currency.format(order.total_amount)}</strong>
                    </div>
                    <div class="order-field">
                        <span>Thanh toán</span>
                        <strong>${escapeHtml(order.payment_method || 'COD')}</strong>
                    </div>
                    <div class="order-field">
                        <span>Địa chỉ giao hàng</span>
                        <strong>${escapeHtml(order.customer_address)}</strong>
                    </div>
                </div>

                <div class="order-card-footer">
                    <span>${escapeHtml(order.customer_name)} - ${escapeHtml(order.customer_phone)}</span>
                    <div class="history-actions">
                        <button class="history-btn primary" onclick="showOrderDetail(${order.id})">Xem chi tiết</button>
                        ${order.status === 'pending' ? `<button class="history-btn danger" onclick="cancelOrder(${order.id})">Hủy đơn</button>` : ''}
                    </div>
                </div>
            </article>
        `).join('');
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
                <span>${escapeHtml(item.title)} x ${item.quantity}</span>
                <strong>${currency.format(item.price * item.quantity)}</strong>
            </li>
        `).join('');

        document.getElementById('orderDetailBody').innerHTML = `
            <h2>Chi tiết đơn #${order.id}</h2>
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

document.getElementById('closeOrderDetail').addEventListener('click', () => {
    document.getElementById('orderDetailModal').classList.remove('open');
});

document.getElementById('orderDetailModal').addEventListener('click', (event) => {
    if (event.target.id === 'orderDetailModal') {
        event.currentTarget.classList.remove('open');
    }
});

document.addEventListener('DOMContentLoaded', loadHistory);
