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
    document.getElementById('resetProductBtn').addEventListener('click', resetProductForm);
    document.getElementById('resetCategoryBtn').addEventListener('click', resetCategoryForm);
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
        await Promise.all([loadDashboard(), loadProducts(), loadOrders(), loadCustomers()]);
    } catch (error) {
        handleAdminError(error);
    }
});
