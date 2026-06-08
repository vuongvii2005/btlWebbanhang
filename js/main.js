// 🔌 API Configuration
const API_URL = 'http://localhost/btlWebbanhang/api/index.php';
const FAVORITE_API_URL = `${window.APP_API_URL || API_URL}?controller=favorite`;
const REVIEW_API_URL = `${window.APP_API_URL || API_URL}?controller=review`;

// 📡 API Helper Function
async function apiCall(controller, action, data = null, method = 'GET', token = null) {
    let url = `${API_URL}?controller=${controller}&action=${action}`;

    if (data && method === 'GET') {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params.append(key, value);
            }
        });

        const queryString = params.toString();
        if (queryString) {
            url += `&${queryString}`;
        }
    }
    
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
let activeSearchQuery = '';





const PRODUCTS_PER_PAGE = 12;
let currentPage = 1;
const productsContainer = document.querySelector('.product-list');
const paginationList = document.querySelector('.page-nav-list');
const homeTitleElement = document.getElementById("home-title");
const searchForm = document.querySelector('.form-search');
const searchInput = document.querySelector('.form-search-input');

function initHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    const prevBtn = slider.querySelector('.slider-prev');
    const nextBtn = slider.querySelector('.slider-next');
    const dotsWrap = slider.querySelector('.slider-dots');

    if (slides.length <= 1 || !dotsWrap) return;

    let currentSlide = 0;
    let sliderTimer = null;

    dotsWrap.innerHTML = slides.map((_, index) => `
        <button class="slider-dot${index === 0 ? ' active' : ''}" type="button" aria-label="Chuyển đến banner ${index + 1}"></button>
    `).join('');

    const dots = Array.from(dotsWrap.querySelectorAll('.slider-dot'));

    function showSlide(index) {
        currentSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('active', slideIndex === currentSlide);
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === currentSlide);
        });
    }

    function startAutoSlide() {
        stopAutoSlide();
        sliderTimer = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 4000);
    }

    function stopAutoSlide() {
        if (sliderTimer) {
            clearInterval(sliderTimer);
            sliderTimer = null;
        }
    }

    function goToSlide(index) {
        showSlide(index);
        startAutoSlide();
    }

    prevBtn?.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn?.addEventListener('click', () => goToSlide(currentSlide + 1));
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    slider.addEventListener('mouseenter', stopAutoSlide);
    slider.addEventListener('mouseleave', startAutoSlide);

    showSlide(0);
    startAutoSlide();
}


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
                <img src="${product.image_url || ''}" alt="${product.title}">
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

function normalizeSearchText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .trim();
}

function normalizeExactSearchText(value) {
    return String(value || '').toLowerCase().trim();
}

function hasVietnameseAccent(value) {
    return normalizeExactSearchText(value) !== normalizeSearchText(value);
}

function parseProductMealTags(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return String(value).split(',').map((tag) => tag.trim()).filter(Boolean);
    }
}

function getCurrentMealPeriod() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
        return 'morning';
    }

    if (hour >= 11 && hour < 16) {
        return 'lunch';
    }

    return 'dinner';
}

function isProductServedNow(product) {
    const tags = parseProductMealTags(product.meal_tags);
    return tags.length === 0 || tags.includes(getCurrentMealPeriod());
}

function getVisibleProducts() {
    const query = activeSearchQuery;
    const useExactAccentSearch = hasVietnameseAccent(query);
    const keyword = useExactAccentSearch
        ? normalizeExactSearchText(query)
        : normalizeSearchText(query);

    if (!keyword) {
        return productsData;
    }

    return productsData.filter((product) => {
        const productName = useExactAccentSearch
            ? normalizeExactSearchText(product.title)
            : normalizeSearchText(product.title);
        return productName.includes(keyword) && isProductServedNow(product);
    });
}

function scrollToProductList() {
    const productsSection = document.querySelector('.product-list');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderCurrentProductPage(shouldScroll = false) {
    const visibleProducts = getVisibleProducts();
    const totalProducts = visibleProducts.length;
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    if (currentPage < 1) currentPage = 1;
    if (totalPages > 0 && currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const productsToShow = visibleProducts.slice(startIndex, endIndex);

    renderProducts(productsToShow);
    renderPagination(totalProducts, totalPages);

    if (shouldScroll) {
        scrollToProductList();
    }
}

function applyProductSearch(query, shouldScroll = false) {
    activeSearchQuery = query;
    currentPage = 1;
    renderCurrentProductPage(shouldScroll);
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
    const visibleProducts = getVisibleProducts();
    const totalProducts = visibleProducts.length; // lấy số lượng ở đây
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    if (newPage < 1 || newPage > totalPages) {
        if (totalProducts === 0) {
            renderProducts([]);
            renderPagination(0, 0);
        }
        return;
    }

    // Cập nhật trạng thái trang
    currentPage = newPage;

    // 2. Tính toán vị trí và lấy dữ liệu
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const productsToShow = visibleProducts.slice(startIndex, endIndex);

    // Render
    renderProducts(productsToShow);
    renderPagination(totalProducts, totalPages);

    // Cuộn lên đầu phần sản phẩm
    if (homeTitleElement) {
        window.scrollTo({ top: homeTitleElement.offsetTop - 50, behavior: 'smooth' });
    }
}

function getRequestedProductId() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get('product_id') || 0);
}

function openRequestedProductDetail(productId) {
    const normalizedProductId = Number(productId || 0);
    if (!normalizedProductId) {
        changePage(currentPage);
        return;
    }

    const productIndex = productsData.findIndex((product) => Number(product.id) === normalizedProductId);
    if (productIndex < 0) {
        changePage(currentPage);
        return;
    }

    currentPage = Math.floor(productIndex / PRODUCTS_PER_PAGE) + 1;
    changePage(currentPage);
    window.setTimeout(() => detailProduct(normalizedProductId), 0);
}


document.addEventListener('DOMContentLoaded', async function () {
    initHeroSlider();

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            applyProductSearch(searchInput.value, true);
        });

        searchInput.addEventListener('input', () => {
            applyProductSearch(searchInput.value, false);
        });
    }

    // 🔌 Load products from API
    try {
        productsData = await apiCall('product', 'list', { limit: 100 }, 'GET');
        openRequestedProductDetail(getRequestedProductId());
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

function setFavoriteButtonState(isFavorite, isLoading = false) {
    const favoriteBtn = document.getElementById('favoriteToggleBtn');
    if (!favoriteBtn) return;

    favoriteBtn.classList.toggle('is-favorite', isFavorite);
    favoriteBtn.classList.toggle('is-loading', isLoading);
    favoriteBtn.disabled = isLoading;
    favoriteBtn.setAttribute('aria-pressed', String(isFavorite));

    if (isLoading) {
        favoriteBtn.innerHTML = `<i class="${isFavorite ? 'fa-solid' : 'fa-light'} fa-heart"></i>`;
        return;
    }

    favoriteBtn.title = isFavorite ? 'Bỏ khỏi món yêu thích' : 'Thêm vào món yêu thích';
    favoriteBtn.setAttribute('aria-label', favoriteBtn.title);
    favoriteBtn.innerHTML = `
        <i class="${isFavorite ? 'fa-solid' : 'fa-light'} fa-heart"></i>
    `;
}

async function loadFavoriteStatus(productId) {
    if (!isLoggedIn()) {
        setFavoriteButtonState(false);
        return;
    }

    try {
        const result = await apiFetch(`${FAVORITE_API_URL}&action=status&product_id=${encodeURIComponent(productId)}`);
        setFavoriteButtonState(Boolean(result.data?.is_favorite));
    } catch (error) {
        console.warn('Không thể tải trạng thái yêu thích:', error);
        setFavoriteButtonState(false);
    }
}

async function toggleFavorite(productId) {
    if (!isLoggedIn()) {
        if (typeof showLoginModal === 'function') showLoginModal();
        if (typeof disablePageScroll === 'function') disablePageScroll();
        return;
    }

    const favoriteBtn = document.getElementById('favoriteToggleBtn');
    const wasFavorite = favoriteBtn?.classList.contains('is-favorite') || false;
    setFavoriteButtonState(wasFavorite, true);

    try {
        const result = await apiFetch(`${FAVORITE_API_URL}&action=toggle`, {
            method: 'POST',
            body: JSON.stringify({ product_id: productId })
        });
        setFavoriteButtonState(Boolean(result.data?.is_favorite));
    } catch (error) {
        setFavoriteButtonState(wasFavorite);

        if (isAuthError(error)) {
            if (typeof showLoginModal === 'function') showLoginModal();
            if (typeof disablePageScroll === 'function') disablePageScroll();
            return;
        }

        alert(error.message || 'Không thể cập nhật món yêu thích.');
    }
}

function renderReviewStars(rating = 0) {
    const normalizedRating = Number(rating || 0);
    let html = '';

    for (let i = 1; i <= 5; i++) {
        const diff = normalizedRating - i;
        const iconClass = normalizedRating >= i
            ? 'fa-solid fa-star'
            : diff >= -0.5
                ? 'fa-solid fa-star-half-stroke'
                : 'fa-light fa-star';

        html += `<i class="${iconClass}"></i>`;
    }

    return html;
}

function renderModalReviewSummary(productId, payload = {}) {
    const section = document.getElementById('productReviewsSection');
    if (!section) return;

    const summary = payload.summary || {};
    const averageRating = Number(summary.average_rating || 0);
    const totalReviews = Number(summary.total_reviews || 0);

    section.innerHTML = `
        <div class="modal-review-score">
            <span class="review-stars modal-stars">${renderReviewStars(averageRating)}</span>
            <strong>${averageRating ? averageRating.toFixed(1) : '0.0'}/5</strong>
            <span>${totalReviews > 0 ? `${totalReviews} lượt đánh giá` : 'Chưa có đánh giá'}</span>
        </div>
        <button class="modal-review-link" type="button" onclick="goToReviewsPage(${Number(productId)})">
            Xem đánh giá
        </button>
    `;
}

function goToReviewsPage(productId) {
    window.location.href = `reviews.html?product_id=${encodeURIComponent(productId)}`;
}

async function loadProductReviews(productId) {
    const section = document.getElementById('productReviewsSection');
    if (!section) return;

    section.innerHTML = '<div class="reviews-loading">Đang tải đánh giá...</div>';

    try {
        const reviewResult = await apiFetch(`${REVIEW_API_URL}&action=stats&product_id=${encodeURIComponent(productId)}`);
        renderModalReviewSummary(productId, reviewResult.data || {});
    } catch (error) {
        section.innerHTML = `
            <div class="reviews-empty">
                <i class="fa-light fa-circle-exclamation"></i>
                <span>Chưa thể tải đánh giá</span>
            </div>
        `;
    }
}

// Hàm hiển thị chi tiết sản phẩm
function detailProduct(productId) {
    // 1. Tìm sản phẩm theo ID
    const normalizedProductId = Number(productId || 0);
    const product = productsData.find(p => Number(p.id) === normalizedProductId);

    if (product) {
        // 2. Định dạng giá tiền
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);

        // 3. Tạo nội dung HTML cho modal
        const modalHtml = `
            <div class="modal-image-container">
                <img src="${product.image_url || ''}" alt="${product.title}">
                
            </div>
            <div class="modal-info">
                <div class="modal-heading-row">
                    <h2 class="modal-title">${product.title}</h2>
                    <button id="favoriteToggleBtn" class="favorite-toggle-btn" type="button" onclick="toggleFavorite(${product.id})" aria-pressed="false" aria-label="Thêm vào món yêu thích" title="Thêm vào món yêu thích">
                        <i class="fa-light fa-heart"></i>
                    </button>
                </div>
                <div class="modal-info-bao">
                    <p class="modal-price">${formattedPrice} <span class="unit"></span></p>
                    <div class="modal-quantity">
                        <button onclick="changeQuantity(-1)">-</button>
                        <input type="number" id="quantityInput" value="1" min="1" readonly>
                        <button onclick="changeQuantity(1)">+</button>
                    </div>
                </div>

                <p class="modal-description">${product.description || ''}</p>

                <div class="modal-note">
                    <h4>GHI CHÚ</h4>
                    <input type="text" id="noteInput" placeholder="Nhập thông tin cần lưu ý...">
                </div>

                <section id="productReviewsSection" class="modal-review-summary" aria-live="polite">
                    <div class="reviews-loading">Đang tải đánh giá...</div>
                </section>

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
        loadFavoriteStatus(product.id);
        loadProductReviews(product.id);
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

function requireCheckoutLogin() {
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        return true;
    }

    if (typeof switchToLogin === 'function') {
        switchToLogin();
    } else {
        if (typeof showLoginModal === 'function') showLoginModal();
        if (typeof disablePageScroll === 'function') disablePageScroll();
    }
    return false;
}

function saveCheckoutCart(items) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const key = user?.id ? `shoppingCart:${user.id}` : 'shoppingCart';
    localStorage.setItem(key, JSON.stringify(items));
}

function goToCheckout() {
    if (cart.length === 0) {
        alert("Giỏ hàng của bạn đang trống!");
        return; 
    }
    // Lưu giỏ hàng vào localStorage
    if (!requireCheckoutLogin()) {
        return;
    }
    saveCheckoutCart(cart);
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
    if (!requireCheckoutLogin()) {
        return;
    }
    // 3. Tạo một giỏ hàng tạm thời CHỈ chứa sản phẩm này
    const singleItemCart = [{
        id: product.id,
        title: product.title,
        price: product.price,
        img: product.image_url,
        image_url: product.image_url,
        quantity: quantity,
        note: note
    }];
    // 4. Lưu giỏ hàng tạm thời này vào localStorage (sử dụng cùng key với giỏ hàng chính)
    saveCheckoutCart(singleItemCart);
    // 5. Chuyển người dùng đến trang thanh toán
    window.location.href = 'checkout.html';
}

function showCategory(categoryName) {
    // 🔌 Load filtered products from API
    (async () => {
        try {
            const filteredProducts = await apiCall('product', 'list', 
                { category: categoryName, limit: 100 }, 'GET');
            productsData = filteredProducts;
            activeSearchQuery = '';
            if (searchInput) searchInput.value = '';
            currentPage = 1; // Reset to first page
            renderCurrentProductPage(false);
            
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
