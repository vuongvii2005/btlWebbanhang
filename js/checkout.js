const CHECKOUT_API = 'http://localhost/btlWebbanhang/api/checkout/create-order.php';
const AUTH_API = 'http://localhost/btlWebbanhang/api/index.php?controller=auth&action=session-user';
const formatMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

let cart = [];
let shippingFee = 30000;

function getCart() {
    try {
        return JSON.parse(localStorage.getItem('shoppingCart') || '[]');
    } catch (error) {
        return [];
    }
}

function normalizeCart(items) {
    return items
        .map((item) => ({
            product_id: Number(item.product_id || item.id),
            title: item.title || 'Sản phẩm',
            price: Number(item.price || 0),
            quantity: Math.max(1, Number(item.quantity || 1)),
            note: item.note || ''
        }))
        .filter((item) => item.product_id > 0 && item.quantity > 0);
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const text = await response.text();
    let result;

    try {
        result = JSON.parse(text);
    } catch (error) {
        throw new Error('API trả về dữ liệu không hợp lệ. Vui lòng kiểm tra PHP error/log.');
    }

    if (!result.success) {
        const error = new Error(result.message || 'API Error');
        error.code = result.code;
        throw error;
    }

    return result.data;
}

function setMessage(message, type = 'error') {
    const el = document.getElementById('checkout-message');
    el.textContent = message || '';
    el.className = `checkout-message ${type}`;
}

function renderCart() {
    const container = document.getElementById('summary-items');
    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    if (cart.length === 0) {
        document.querySelector('.checkout-container').innerHTML = `
            <div class="empty-checkout">
                <h1>Giỏ hàng trống</h1>
                <a href="index.html">Quay lại mua hàng</a>
            </div>
        `;
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    container.innerHTML = cart.map((item) => {
        const lineTotal = item.price * item.quantity;
        return `
            <div class="summary-item">
                <div>
                    <strong>${item.title}</strong>
                    <small>Giá: ${formatMoney.format(item.price)} | SL: ${item.quantity}</small>
                    ${item.note ? `<small>Ghi chú: ${item.note}</small>` : ''}
                </div>
                <span>${formatMoney.format(lineTotal)}</span>
            </div>
        `;
    }).join('');

    subtotalEl.textContent = formatMoney.format(subtotal);
    shippingEl.textContent = formatMoney.format(shippingFee);
    totalEl.textContent = formatMoney.format(subtotal + shippingFee);
}

async function requireLoginAndFillUser() {
    try {
        const user = await fetchJson(AUTH_API);
        document.getElementById('customer-name').value = user.fullname || '';
        document.getElementById('customer-phone').value = user.phone || '';
        document.getElementById('customer-address').value = user.address || '';
        document.getElementById('customer-email').value = user.email || '';
    } catch (error) {
        window.location.href = 'index.html';
    }
}

function setupDeliveryControls() {
    const btnDelivery = document.getElementById('btn-delivery');
    const btnPickup = document.getElementById('btn-pickup');
    const shippingFeeRow = document.getElementById('shipping-fee-row');

    btnDelivery.addEventListener('click', () => {
        btnDelivery.classList.add('active');
        btnPickup.classList.remove('active');
        shippingFee = 30000;
        shippingFeeRow.style.display = 'flex';
        renderCart();
    });

    btnPickup.addEventListener('click', () => {
        btnPickup.classList.add('active');
        btnDelivery.classList.remove('active');
        shippingFee = 0;
        shippingFeeRow.style.display = 'none';
        renderCart();
    });

    document.querySelectorAll('[data-offset]').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-offset]').forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function getDeliveryDate() {
    const active = document.querySelector('[data-offset].active');
    const offset = Number(active?.dataset.offset || 0);
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
}

function getDeliveryTime() {
    const selected = document.querySelector('input[name="delivery-time"]:checked')?.value;
    return selected === 'timed' ? document.getElementById('specific-time').value : 'asap';
}

function validateForm() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!name || !phone || !address) {
        throw new Error('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.');
    }

    if (!/^(0|\+84)[1-9][0-9]{8,9}$/.test(phone)) {
        throw new Error('Số điện thoại không đúng định dạng.');
    }

    if (cart.length === 0) {
        throw new Error('Giỏ hàng đang trống.');
    }
}

async function placeOrder() {
    const button = document.getElementById('placeOrderBtn');

    try {
        validateForm();
        button.disabled = true;
        setMessage('Đang đặt hàng...', 'info');

        const payload = {
            customer_name: document.getElementById('customer-name').value.trim(),
            customer_phone: document.getElementById('customer-phone').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            customer_address: document.getElementById('customer-address').value.trim(),
            delivery_type: document.getElementById('btn-pickup').classList.contains('active') ? 'pickup' : 'delivery',
            delivery_date: getDeliveryDate(),
            delivery_time: getDeliveryTime(),
            payment_method: 'COD',
            notes: document.getElementById('order-notes').value.trim(),
            items: cart.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                note: item.note
            }))
        };

        await fetchJson(CHECKOUT_API, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        localStorage.removeItem('shoppingCart');
        alert('Đặt hàng thành công');
        window.location.href = 'history.html';
    } catch (error) {
        if (error.code === 401) {
            window.location.href = 'index.html';
            return;
        }
        setMessage(error.message);
    } finally {
        button.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    cart = normalizeCart(getCart());
    setupDeliveryControls();
    renderCart();
    await requireLoginAndFillUser();
});
