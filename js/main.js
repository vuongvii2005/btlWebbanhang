// 🔌 API Configuration
const API_URL = 'http://localhost/btlWebbanhang/api/index.php';

// 📡 API Helper Function
async function apiCall(controller, action, data = null, method = 'GET', token = null) {
    let url = `${API_URL}?controller=${controller}&action=${action}`;
    
    const options = {
        method: method,
        headers: {}
    };
    
    // Only set Content-Type for requests with body
    if (data && (method === 'POST' || method === 'PUT')) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message || 'API Error');
    }
    
    return result.data;
}

// ✅ Global product data (loaded from API)
let productsData = [];





const PRODUCTS_PER_PAGE = 12;
let currentPage = 1;
const productsContainer = document.querySelector('.product-list');
const paginationList = document.querySelector('.page-nav-list');
const homeTitleElement = document.getElementById("home-title");


function renderProducts(productsData) {
    let productHtml = '';

    if (productsData.length === 0) {
        if (homeTitleElement) homeTitleElement.style.display = "none";
        // Nội dung khi không có kết quả
        productHtml = `<div class="no-result"><div class="no-result-h">Tìm kiếm không có kết quả</div><div class="no-result-p">Xin lỗi, chúng tôi không thể tìm được kết quả hợp với tìm kiếm của bạn</div><div class="no-result-i"><i class="fa-light fa-face-sad-cry"></i></div></div>`;
    } else {
        if (homeTitleElement) homeTitleElement.style.display = "block";

        productsData.forEach((product) => {
            productHtml += `
            <div class="product-card">
                <img src="${product.img}" alt="${product.title}">
                <h3 class="product-name">${product.title}</h3>
                <p class="product-price">
                ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
                <button class="product-btn" onclick="detailProduct(${product.id})">
                    <i class="fa-solid fa-cart-shopping"></i> Đặt món
                </button>
            </div>
            `;
        });
    }

    if (productsContainer) {
        productsContainer.innerHTML = productHtml;
    }
}


function renderPagination(totalProducts, totalPages) {
    if (!paginationList) return;

    if (totalPages <= 1) {
        paginationList.innerHTML = '';
        return;
    }

    let paginationHtml = '';

    // Nút "Trang Trước" (<)
    paginationHtml += `<li class="page-nav-item ${currentPage === 1 ? 'disabled' : ''}">
        <a href="#" onclick="event.preventDefault(); changePage(${currentPage - 1})"><i class="fa-solid fa-angle-left"></i></a>
    </li>`;

    // Các nút số trang (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage ? 'active' : '';
        paginationHtml += `<li class="page-nav-item ${isActive}">
            <a href="#" onclick="event.preventDefault(); changePage(${i})">${i}</a>
        </li>`;
    }

    // Nút "Trang Sau" (>)
    paginationHtml += `<li class="page-nav-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a href="#" onclick="event.preventDefault(); changePage(${currentPage + 1})"><i class="fa-solid fa-angle-right"></i></a>
    </li>`;

    paginationList.innerHTML = paginationHtml;
}

function changePage(newPage) {
    const totalProducts = productsData.length; // lấy số lượng ở đây
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    if (newPage < 1 || newPage > totalPages) {
        return;
    }

    // Cập nhật trạng thái trang
    currentPage = newPage;

    // 2. Tính toán vị trí và lấy dữ liệu
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const productsToShow = productsData.slice(startIndex, endIndex);

    // Render
    renderProducts(productsToShow);
    renderPagination(totalProducts, totalPages);

    // Cuộn lên đầu phần sản phẩm
    if (homeTitleElement) {
        window.scrollTo({ top: homeTitleElement.offsetTop - 50, behavior: 'smooth' });
    }
}


document.addEventListener('DOMContentLoaded', async function () {

    // �🔌 Load products from API
    try {
        productsData = await apiCall('products', 'list', null, 'GET');
        changePage(currentPage);
    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        renderProducts([]);
    }
});

// xem chi tiết sản phẩm

// Lấy các element của modal
const detailModal = document.getElementById('productDetailModal');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn'); // Nút đóng modal

// Hàm hiển thị chi tiết sản phẩm
function detailProduct(productId) {
    // 1. Tìm sản phẩm theo ID
    const product = productsData.find(p => p.id === productId);

    if (product) {
        // 2. Định dạng giá tiền
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);

        // 3. Tạo nội dung HTML cho modal
        const modalHtml = `
            <div class="modal-image-container">
                <img src="${product.img}" alt="${product.title}">
                
            </div>
            <div class="modal-info">
                <h2 class="modal-title">${product.title}</h2>
                <div class="modal-info-bao">
                    <p class="modal-price">${formattedPrice} <span class="unit"></span></p>
                    <div class="modal-quantity">
                        <button onclick="changeQuantity(-1)">-</button>
                        <input type="number" id="quantityInput" value="1" min="1" readonly>
                        <button onclick="changeQuantity(1)">+</button>
                    </div>
                </div>

                <p class="modal-description">${product.desc}</p>

                <div class="modal-note">
                    <h4>GHI CHÚ</h4>
                    <input type="text" id="noteInput" placeholder="Nhập thông tin cần lưu ý...">
                </div>

                <div class="modal-total">
                    <span class="label">Thành tiền</span>
                    <span id="modalTotalAmount" class="amount">${formattedPrice}</span>
                </div>

                <div class="modal-actions">
                    <button class="add-to-cart-btn" onclick="buyNow(${product.id})"><i class="fa-solid fa-cart-shopping"></i> Đặt hàng ngay</button>
                    <button class="quick-add-btn" onclick="addToCart(${product.id})"><i class="fa-light fa-basket-shopping"></i></button>
                </div>
            </div>
        `;

        // 4. Đưa nội dung vào modal và hiển thị
        modalContent.innerHTML = modalHtml;
        detailModal.style.display = 'flex'; // Hiển thị modal (sử dụng flex để căn giữa)
        document.body.style.overflow = 'hidden'; // Ngăn cuộn trang nền

        document.getElementById('quantityInput').dataset.price = product.price; // Lưu giá gốc
    } else {
        console.error("Không tìm thấy sản phẩm với ID: " + productId);
    }
}
function closeProductDetailModal() {
    const detailModal = document.getElementById('productDetailModal');
    detailModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Cho phép cuộn trang nền lại
}

// Logic thay đổi số lượng và cập nhật tổng tiền
function changeQuantity(change) {
    const quantityInput = document.getElementById('quantityInput');
    const totalAmountElement = document.getElementById('modalTotalAmount');

    let currentQuantity = parseInt(quantityInput.value);
    const newQuantity = Math.max(1, currentQuantity + change);

    quantityInput.value = newQuantity;

    // Cập nhật tổng tiền
    const price = parseInt(quantityInput.dataset.price);
    const newTotal = newQuantity * price;

    totalAmountElement.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newTotal);
}
// Đóng modal khi click ra ngoài
window.onclick = function (event) {
    const detailModal = document.getElementById('productDetailModal');

    if (event.target === detailModal) {
        closeProductDetailModal();
    }
}
const modalCloseBtn = document.getElementById('modalCloseBtn');
modalCloseBtn.onclick = closeProductDetailModal;

function goToCheckout() {
    if (cart.length === 0) {
        alert("Giỏ hàng của bạn đang trống!");
        return; 
    }
    // Lưu giỏ hàng vào localStorage
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    // Chuyển sang trang checkout.html
    window.location.href = 'checkout.html';

}

function buyNow(productId) {
    // 1. Lấy thông tin số lượng và ghi chú từ modal chi tiết
    const quantityInput = document.getElementById('quantityInput');
    const noteInput = document.getElementById('noteInput');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    const note = noteInput ? noteInput.value.trim() : '';
    // 2. Tìm thông tin sản phẩm
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        alert("Không tìm thấy sản phẩm!");
        return;
    }
    // 3. Tạo một giỏ hàng tạm thời CHỈ chứa sản phẩm này
    const singleItemCart = [{
        id: product.id,
        title: product.title,
        price: product.price,
        img: product.img,
        quantity: quantity,
        note: note
    }];
    // 4. Lưu giỏ hàng tạm thời này vào localStorage (sử dụng cùng key với giỏ hàng chính)
    localStorage.setItem('shoppingCart', JSON.stringify(singleItemCart));
    // 5. Chuyển người dùng đến trang thanh toán
    window.location.href = 'checkout.html';
}

function showCategory(categoryName) {
    // 🔌 Load filtered products from API
    (async () => {
        try {
            const filteredProducts = await apiCall('products', 'list', 
                { category: categoryName }, 'GET');
            productsData = filteredProducts;
            currentPage = 1; // Reset to first page
            renderProducts(filteredProducts);
            
            const productsSection = document.querySelector('.product-list');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            console.error('Lỗi lọc danh mục:', error);
            alert('Lỗi: ' + error.message);
        }
    })();
}
