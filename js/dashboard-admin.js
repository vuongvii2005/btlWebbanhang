const API_URL = window.APP_API_URL || 'http://localhost/btlWebbanhang/api/index.php';
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const orderStatusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    delivered: 'Hoàn thành',
    cancelled: 'Đã hủy'
};

let categories = [];
let products = [];
let orders = [];
let customers = [];
let coupons = [];

async function api(controller, action, data = null, method = 'GET') {
    let url = `${API_URL}?controller=${controller}&action=${action}`;
    const options = {
        method
    };

    if (method === 'GET' && data) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params.append(key, value);
            }
        });
        const query = params.toString();
        if (query) url += `&${query}`;
    } else if (data) {
        options.body = JSON.stringify(data);
    }

    return apiFetch(url, options);
}

function statusOptions(selected) {
    const normalizedSelected = selected === 'delivered' ? 'completed' : selected;
    return Object.entries(orderStatusLabels)
        .filter(([value]) => value !== 'delivered')
        .map(([value, label]) => `<option value="${value}" ${value === normalizedSelected ? 'selected' : ''}>${label}</option>`)
        .join('');
}

function showAdminError(message) {
    const el = document.getElementById('adminName');
    if (el) el.textContent = message;
}

function handleAdminError(error) {
    if (isAuthError(error)) {
        clearAuth();
        window.location.href = 'index.html';
        return true;
    }

    console.error('Admin request failed:', error);
    showAdminError(`Lỗi: ${error.message || 'Không thể tải dữ liệu'}`);
    return false;
}

async function requireAdmin() {
    if (!isLoggedIn()) {
        clearAuth();
        window.location.href = 'index.html';
        return false;
    }

    try {
        const result = await api('admin', 'me');
        document.getElementById('adminName').textContent = `Xin chào, ${result.data.fullname || 'Admin'}`;
        return true;
    } catch (error) {
        handleAdminError(error);
        return false;
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach((section) => section.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.section).classList.add('active');
        });
    });
}

async function loadDashboard() {
    const result = await api('admin', 'dashboard');
    const data = result.data;
    document.getElementById('statProducts').textContent = data.total_products;
    document.getElementById('statOrders').textContent = data.total_orders;
    document.getElementById('statCustomers').textContent = data.total_customers;
    document.getElementById('statRevenue').textContent = money.format(data.total_revenue);
    renderRecentOrders(data.recent_orders || []);
}

function renderRecentOrders(items) {
    document.getElementById('recentOrdersTable').innerHTML = items.map((order) => `
        <tr>
            <td>#${order.id}</td>
            <td>${escapeHtml(order.customer_name)}</td>
            <td>${escapeHtml(order.customer_phone)}</td>
            <td>${money.format(order.total_amount)}</td>
            <td><span class="status-pill status-${order.status}">${orderStatusLabels[order.status] || order.status}</span></td>
            <td>${escapeHtml(order.created_at)}</td>
        </tr>
    `).join('');
}

async function loadCategories() {
    const result = await api('admin', 'categories');
    categories = result.data;
    renderCategories();
    renderCategorySelect();
}

function renderCategorySelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Chọn danh mục</option>' + categories.map((category) => (
        `<option value="${category.id}">${escapeHtml(category.name)}</option>`
    )).join('');
}

function renderCategories() {
    document.getElementById('categoriesTable').innerHTML = categories.map((category) => `
        <tr>
            <td>${category.id}</td>
            <td>${escapeHtml(category.name)}</td>
            <td>${escapeHtml(category.description)}</td>
            <td>${category.display_order || 0}</td>
            <td>
                <div class="row-actions">
                    <button class="small-btn" onclick="editCategory(${category.id})">Sửa</button>
                    <button class="danger-btn" onclick="deleteCategory(${category.id})">Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadProducts() {
    const result = await api('product', 'admin-list', { limit: 100 });
    products = result.data;
    renderProducts();
}

function renderProducts() {
    document.getElementById('productsTable').innerHTML = products.map((product) => `
        <tr>
            <td><img class="product-thumb" src="${escapeHtml(product.image_url || '')}" alt="${escapeHtml(product.title)}"></td>
            <td>${escapeHtml(product.title)}<br><small>${escapeHtml(product.description).slice(0, 90)}</small></td>
            <td>${escapeHtml(product.category_name || '')}</td>
            <td>${money.format(product.price)}</td>
            <td><span class="status-pill ${Number(product.status) === 1 ? 'status-on' : 'status-off'}">${Number(product.status) === 1 ? 'Còn bán' : 'Ngừng bán'}</span></td>
            <td>
                <div class="row-actions">
                    <button class="small-btn" onclick="editProduct(${product.id})">Sửa</button>
                    <button class="small-btn" onclick="toggleProductStatus(${product.id})">${Number(product.status) === 1 ? 'Ngừng bán' : 'Mở bán'}</button>
                    <button class="danger-btn" onclick="deleteProduct(${product.id})">Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadOrders(search = '') {
    const result = await api('orders', 'admin-all', { limit: 100, search });
    orders = result.data;
    renderOrders();
}

function renderOrders() {
    document.getElementById('ordersTable').innerHTML = orders.map((order) => `
        <tr>
            <td>#${order.id}</td>
            <td>${escapeHtml(order.customer_name)}</td>
            <td>${escapeHtml(order.customer_phone)}</td>
            <td>${money.format(order.total_amount)}</td>
            <td>
                <select onchange="updateOrderStatus(${order.id}, this.value)">
                    ${statusOptions(order.status)}
                </select>
            </td>
            <td>${escapeHtml(order.created_at)}</td>
            <td><button class="small-btn" onclick="showOrderDetail(${order.id})">Chi tiết</button></td>
        </tr>
    `).join('');
}

async function loadCustomers() {
    const result = await api('admin', 'customers', { limit: 100 });
    customers = result.data;
    renderCustomers();
    renderGiftCustomerSelect();
}

function renderCustomers() {
    document.getElementById('customersTable').innerHTML = customers.map((customer) => `
        <tr>
            <td>${customer.id}</td>
            <td>${escapeHtml(customer.fullname)}</td>
            <td>${escapeHtml(customer.phone)}</td>
            <td>${escapeHtml(customer.email)}</td>
            <td><span class="status-pill ${Number(customer.status) === 1 ? 'status-on' : 'status-off'}">${Number(customer.status) === 1 ? 'Đang mở' : 'Đã khóa'}</span></td>
            <td>${escapeHtml(customer.created_at)}</td>
            <td>
                <div class="row-actions">
                    <button class="small-btn" onclick="viewCustomer(${customer.id})">Xem</button>
                    <button class="small-btn" onclick="toggleCustomerStatus(${customer.id})">${Number(customer.status) === 1 ? 'Khóa' : 'Mở khóa'}</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadCoupons() {
    setCouponsTableMessage('Đang tải mã giảm giá...');

    try {
        const result = await api('admin', 'coupons');
        coupons = result.data || [];
        renderCoupons();
        renderGiftCouponSelect();
    } catch (error) {
        setCouponsTableMessage(error.message || 'Không thể tải danh sách mã giảm giá.');
        throw error;
    }
}

function formatDateTime(value) {
    if (!value) return 'Không giới hạn';
    return String(value).replace('T', ' ').slice(0, 16);
}

function toDateTimeInput(value) {
    if (!value) return '';
    return String(value).replace(' ', 'T').slice(0, 16);
}

function couponCondition(coupon) {
    const minOrder = Number(coupon.min_order_amount || 0);
    const maxDiscount = Number(coupon.max_discount_amount || 0);
    const parts = [];

    parts.push(minOrder > 0 ? `Đơn từ ${money.format(minOrder)}` : 'Không yêu cầu đơn tối thiểu');
    if (coupon.discount_type === 'percent' && maxDiscount > 0) {
        parts.push(`Tối đa ${money.format(maxDiscount)}`);
    }

    return parts.join('<br>');
}

function couponExchangeLabel(coupon) {
    const pointsRequired = Number(coupon.points_required || 0);
    if (pointsRequired > 0) {
        return `Cần ${pointsRequired.toLocaleString('vi-VN')} điểm<br><small>${Number(coupon.redeemed_count || 0)} lượt đã đổi</small>`;
    }

    return 'Không đổi điểm';
}

function setCouponsTableMessage(message) {
    const table = document.getElementById('couponsTable');
    if (!table) return;

    table.innerHTML = `
        <tr>
            <td class="table-empty" colspan="9">${escapeHtml(message)}</td>
        </tr>
    `;
}

function renderCoupons() {
    const table = document.getElementById('couponsTable');
    if (!table) return;

    if (!coupons.length) {
        setCouponsTableMessage('Chưa có mã giảm giá nào trong database.');
        return;
    }

    table.innerHTML = coupons.map((coupon) => {
        const usageLimit = coupon.usage_limit ? coupon.usage_limit : 'Không giới hạn';
        const giftedCount = Number(coupon.gifted_count || 0);
        const giftedUsedCount = Number(coupon.gifted_used_count || 0);
        const canToggleOn = Number(coupon.status) !== 1;

        return `
            <tr>
                <td><strong>${escapeHtml(coupon.code)}</strong><br><small>${escapeHtml(coupon.title)}</small></td>
                <td>${escapeHtml(coupon.benefit_label || '')}</td>
                <td>${couponExchangeLabel(coupon)}</td>
                <td>${couponCondition(coupon)}</td>
                <td>${Number(coupon.used_count || 0)} đã dùng<br><small>Giới hạn đổi: ${usageLimit}</small></td>
                <td>${escapeHtml(formatDateTime(coupon.start_date))}<br>${escapeHtml(formatDateTime(coupon.end_date))}</td>
                <td>
                    <span class="status-pill ${Number(coupon.status) === 1 ? 'status-on' : 'status-off'}">${Number(coupon.status) === 1 ? 'Đang bật' : 'Tạm tắt'}</span>
                    <br><small>${coupon.can_gift ? 'Có thể tặng' : 'Chưa thể tặng'}</small>
                </td>
                <td>${giftedCount} mã<br><small>${giftedUsedCount} đã dùng</small></td>
                <td>
                    <div class="row-actions">
                        <button class="small-btn" type="button" onclick="editCoupon(${Number(coupon.id)})">Sửa</button>
                        <button class="small-btn" type="button" onclick="toggleCouponStatus(${Number(coupon.id)}, ${canToggleOn ? 1 : 0})">${canToggleOn ? 'Bật' : 'Tắt'}</button>
                        <button class="danger-btn" type="button" onclick="deleteCoupon(${Number(coupon.id)})">Ẩn</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderGiftCouponSelect() {
    const select = document.getElementById('giftCouponId');
    if (!select) return;

    select.innerHTML = '<option value="">Chọn mã giảm giá</option>' + coupons
        .filter((coupon) => Boolean(coupon.can_gift))
        .map((coupon) => `<option value="${coupon.id}">${escapeHtml(coupon.code)} - ${escapeHtml(coupon.title)}</option>`)
        .join('');
}

function renderGiftCustomerSelect() {
    const select = document.getElementById('giftUserId');
    if (!select) return;

    select.innerHTML = '<option value="">Chọn khách hàng</option>' + customers
        .filter((customer) => Number(customer.status) === 1)
        .map((customer) => (
            `<option value="${customer.id}">${escapeHtml(customer.fullname)} - ${escapeHtml(customer.phone || customer.email || '')}</option>`
        ))
        .join('');
}

function setAdminMessage(id, message = '', type = '') {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = message;
    el.className = `admin-message ${type}`.trim();
}

function normalizeDateInput(id) {
    const value = document.getElementById(id).value;
    return value ? value : null;
}

function resetCouponForm() {
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = '';
    document.getElementById('couponDiscountType').value = 'fixed';
    document.getElementById('couponPointsRequired').value = '0';
    document.getElementById('couponPerUserLimit').value = '1';
    document.getElementById('couponStatus').value = '1';
    document.getElementById('couponSubmitBtn').textContent = 'Tạo mã';
    setAdminMessage('couponMessage');
}

function editCoupon(id) {
    const coupon = coupons.find((item) => Number(item.id) === Number(id));
    if (!coupon) return;

    document.getElementById('couponId').value = coupon.id;
    document.getElementById('couponCode').value = coupon.code || '';
    document.getElementById('couponTitle').value = coupon.title || '';
    document.getElementById('couponDescription').value = coupon.description || '';
    document.getElementById('couponDiscountType').value = coupon.discount_type || 'fixed';
    document.getElementById('couponDiscountValue').value = Number(coupon.discount_value || 0);
    document.getElementById('couponMinOrder').value = Number(coupon.min_order_amount || 0);
    document.getElementById('couponMaxDiscount').value = coupon.max_discount_amount ?? '';
    document.getElementById('couponPointsRequired').value = Number(coupon.points_required || 0);
    document.getElementById('couponUsageLimit').value = coupon.usage_limit ?? '';
    document.getElementById('couponPerUserLimit').value = Number(coupon.per_user_limit || 1);
    document.getElementById('couponStatus').value = Number(coupon.status) === 1 ? '1' : '0';
    document.getElementById('couponStartDate').value = toDateTimeInput(coupon.start_date);
    document.getElementById('couponEndDate').value = toDateTimeInput(coupon.end_date);
    document.getElementById('couponSubmitBtn').textContent = 'Cập nhật mã';
    document.getElementById('couponCode').focus();
    document.getElementById('couponForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveCoupon(event) {
    event.preventDefault();

    try {
        const id = document.getElementById('couponId').value;
        const data = {
            id,
            code: document.getElementById('couponCode').value.trim(),
            title: document.getElementById('couponTitle').value.trim(),
            description: document.getElementById('couponDescription').value.trim(),
            discount_type: document.getElementById('couponDiscountType').value,
            discount_value: document.getElementById('couponDiscountValue').value || 0,
            min_order_amount: document.getElementById('couponMinOrder').value || 0,
            max_discount_amount: document.getElementById('couponMaxDiscount').value,
            points_required: document.getElementById('couponPointsRequired').value || 0,
            usage_limit: document.getElementById('couponUsageLimit').value,
            per_user_limit: document.getElementById('couponPerUserLimit').value || 1,
            status: document.getElementById('couponStatus').value,
            start_date: normalizeDateInput('couponStartDate'),
            end_date: normalizeDateInput('couponEndDate')
        };

        await api('admin', id ? 'coupon-update' : 'coupon-create', data, 'POST');
        resetCouponForm();
        await loadCoupons();
        setAdminMessage('couponMessage', id ? 'Đã cập nhật mã giảm giá.' : 'Đã tạo mã giảm giá.', 'success');
    } catch (error) {
        if (!handleAdminError(error)) {
            setAdminMessage('couponMessage', error.message || 'Không thể tạo mã giảm giá.', 'error');
        }
    }
}

async function toggleCouponStatus(id, status) {
    try {
        await api('admin', 'coupon-toggle', { id, status }, 'POST');
        await loadCoupons();
        setAdminMessage('couponMessage', status === 1 ? 'Đã bật mã giảm giá.' : 'Đã tắt mã giảm giá.', 'success');
    } catch (error) {
        if (!handleAdminError(error)) {
            setAdminMessage('couponMessage', error.message || 'Không thể đổi trạng thái mã.', 'error');
        }
    }
}

async function deleteCoupon(id) {
    if (!confirm('Ẩn mã giảm giá này? Mã sẽ không còn hiển thị để khách đổi hoặc sử dụng.')) return;

    try {
        await api('admin', 'coupon-delete', { id }, 'POST');
        await loadCoupons();
        setAdminMessage('couponMessage', 'Đã ẩn mã giảm giá.', 'success');
    } catch (error) {
        if (!handleAdminError(error)) {
            setAdminMessage('couponMessage', error.message || 'Không thể ẩn mã giảm giá.', 'error');
        }
    }
}

async function giftCoupon(event) {
    event.preventDefault();

    try {
        const data = {
            coupon_id: document.getElementById('giftCouponId').value,
            user_id: document.getElementById('giftUserId').value,
            expired_at: normalizeDateInput('giftExpiredAt')
        };

        const result = await api('admin', 'coupon-gift', data, 'POST');
        await loadCoupons();
        setAdminMessage('giftCouponMessage', `Đã tặng mã ${result.data.coupon_code} cho ${result.data.customer_name}.`, 'success');
        document.getElementById('giftCouponForm').reset();
    } catch (error) {
        if (!handleAdminError(error)) {
            setAdminMessage('giftCouponMessage', error.message || 'Không thể tặng mã giảm giá.', 'error');
        }
    }
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productStatus').value = '1';
}

function editProduct(id) {
    const product = products.find((item) => Number(item.id) === Number(id));
    if (!product) return;
    document.getElementById('productId').value = product.id;
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category_id;
    document.getElementById('productImage').value = product.image_url || '';
    document.getElementById('productStatus').value = product.status;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productTitle').focus();
}

async function saveProduct(event) {
    event.preventDefault();
    try {
        const id = document.getElementById('productId').value;
        const data = {
            id,
            title: document.getElementById('productTitle').value.trim(),
            price: document.getElementById('productPrice').value,
            category_id: document.getElementById('productCategory').value,
            image_url: document.getElementById('productImage').value.trim(),
            status: document.getElementById('productStatus').value,
            description: document.getElementById('productDescription').value.trim()
        };
        await api('product', id ? 'update' : 'create', data, 'POST');
        resetProductForm();
        await Promise.all([loadProducts(), loadDashboard()]);
    } catch (error) {
        handleAdminError(error);
    }
}

async function toggleProductStatus(id) {
    try {
        const product = products.find((item) => Number(item.id) === Number(id));
        if (!product) return;
        await api('product', 'update', { id, status: Number(product.status) === 1 ? 0 : 1 }, 'POST');
        await Promise.all([loadProducts(), loadDashboard()]);
    } catch (error) {
        handleAdminError(error);
    }
}

async function deleteProduct(id) {
    if (!confirm('Xóa món ăn này? Món sẽ chuyển sang trạng thái ngừng bán.')) return;
    try {
        await api('product', 'delete', { id }, 'POST');
        await Promise.all([loadProducts(), loadDashboard()]);
    } catch (error) {
        handleAdminError(error);
    }
}

function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryOrder').value = 0;
}

function editCategory(id) {
    const category = categories.find((item) => Number(item.id) === Number(id));
    if (!category) return;
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryOrder').value = category.display_order || 0;
    document.getElementById('categoryName').focus();
}

async function saveCategory(event) {
    event.preventDefault();
    try {
        const id = document.getElementById('categoryId').value;
        const data = {
            id,
            name: document.getElementById('categoryName').value.trim(),
            description: document.getElementById('categoryDescription').value.trim(),
            display_order: document.getElementById('categoryOrder').value || 0
        };
        await api('admin', id ? 'category-update' : 'category-create', data, 'POST');
        resetCategoryForm();
        await loadCategories();
    } catch (error) {
        handleAdminError(error);
    }
}

async function deleteCategory(id) {
    if (!confirm('Xóa danh mục này?')) return;
    try {
        await api('admin', 'category-delete', { id }, 'POST');
        await loadCategories();
    } catch (error) {
        handleAdminError(error);
    }
}

async function showOrderDetail(id) {
    try {
        const result = await api('orders', 'admin-detail', { id });
        const order = result.data;
        const itemsHtml = (order.items || []).map((item) => `
            <li>${escapeHtml(item.title)} x ${item.quantity} - ${money.format(item.price * item.quantity)}</li>
        `).join('');
        document.getElementById('orderDetail').innerHTML = `
            <h3>Đơn hàng #${order.id}</h3>
            <p><strong>Khách:</strong> ${escapeHtml(order.customer_name)} - ${escapeHtml(order.customer_phone)}</p>
            <p><strong>Địa chỉ:</strong> ${escapeHtml(order.customer_address)}</p>
            <p><strong>Ghi chú:</strong> ${escapeHtml(order.notes)}</p>
            <ul>${itemsHtml}</ul>
        `;
    } catch (error) {
        handleAdminError(error);
    }
}

async function updateOrderStatus(id, status) {
    try {
        await api('orders', 'update-status', { id, status }, 'POST');
        await Promise.all([loadOrders(document.getElementById('orderSearch').value.trim()), loadDashboard()]);
    } catch (error) {
        handleAdminError(error);
    }
}

function viewCustomer(id) {
    const customer = customers.find((item) => Number(item.id) === Number(id));
    if (!customer) return;
    alert(`Tên: ${customer.fullname}\nSĐT: ${customer.phone}\nEmail: ${customer.email || ''}\nĐịa chỉ: ${customer.address || ''}`);
}

async function toggleCustomerStatus(id) {
    try {
        const customer = customers.find((item) => Number(item.id) === Number(id));
        if (!customer) return;
        await api('admin', 'customer-status', { id, status: Number(customer.status) === 1 ? 0 : 1 }, 'POST');
        await loadCustomers();
    } catch (error) {
        handleAdminError(error);
    }
}

async function logoutAdmin() {
    try {
        await api('auth', 'logout', {}, 'POST');
    } catch (error) {
        // Local cleanup still matters if the session already expired.
    }
    clearAuth();
    window.location.href = 'index.html';
}

function setupForms() {
    document.getElementById('productForm').addEventListener('submit', saveProduct);
    document.getElementById('categoryForm').addEventListener('submit', saveCategory);
    document.getElementById('couponForm').addEventListener('submit', saveCoupon);
    document.getElementById('giftCouponForm').addEventListener('submit', giftCoupon);
    document.getElementById('resetProductBtn').addEventListener('click', resetProductForm);
    document.getElementById('resetCategoryBtn').addEventListener('click', resetCategoryForm);
    document.getElementById('resetCouponBtn').addEventListener('click', resetCouponForm);
    document.getElementById('logoutBtn').addEventListener('click', logoutAdmin);
    document.getElementById('orderSearch').addEventListener('input', (event) => {
        clearTimeout(window.orderSearchTimer);
        window.orderSearchTimer = setTimeout(() => {
            loadOrders(event.target.value.trim()).catch(handleAdminError);
        }, 250);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        setupNavigation();
        setupForms();
        const canAccess = await requireAdmin();
        if (!canAccess) return;

        await loadCategories();
        await Promise.all([loadDashboard(), loadProducts(), loadOrders(), loadCustomers(), loadCoupons()]);
    } catch (error) {
        handleAdminError(error);
    }
});
