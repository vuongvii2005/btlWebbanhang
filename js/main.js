const loginModal = document.querySelector('.modal.signup-login');
const loginLinks = document.querySelectorAll('#login');
const signupLinks = document.querySelectorAll('#signup, .signup-link');
const closeButton = document.querySelector('.form-close');
const loginFormContainer = document.querySelector('.form-content.login');
const signupFormContainer = document.querySelector('.form-content.sign-up');
const loginSwitchLink = document.querySelector('.login-link');
const mainMenuLogin = document.querySelector('.main-menu-login');
const dropdownMenu = document.querySelector('.header-middle-right-menu');
const signupForm = document.querySelector('.signup-form');
const loginForm = document.querySelector('.login-form');

let userDatabase = [
    { phone: '0901234567', password: 'admin123', fullname: 'vuongvi' }
];

function displayError(el, msg, msgClass) {
    const msgEl = document.querySelector(msgClass);
    if (msgEl) msgEl.textContent = msg;
    if (el) el.classList.add('is-invalid');
}

function clearError(el, msgClass) {
    const msgEl = document.querySelector(msgClass);
    if (msgEl) msgEl.textContent = '';
    if (el) el.classList.remove('is-invalid');
}

function clearAllErrors() {
    document.querySelectorAll('.form-control').forEach(i => i.classList.remove('is-invalid'));
    document.querySelectorAll('.form-message').forEach(s => s.textContent = '');
    const checkbox = signupForm?.querySelector('#checkbox-signup');
    if (checkbox) checkbox.checked = false;
}

function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const icon = button.querySelector('i');
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            icon.classList.toggle('fa-eye', !isHidden);
            icon.classList.toggle('fa-eye-slash', isHidden);
            icon.classList.toggle('fa-light', !isHidden);
            icon.classList.toggle('fa-solid', isHidden);
        });
    });
}
setupPasswordToggles();

function validateSignupForm() {
    let valid = true;
    const fullname = signupForm.querySelector('#fullname');
    const phone = signupForm.querySelector('#phone');
    const pass = signupForm.querySelector('#password');
    const confirm = signupForm.querySelector('#password_confirmation');
    const checkbox = signupForm.querySelector('#checkbox-signup');
    const phoneRegex = /^\d{10,11}$/;

    clearAllErrors();

    if (!fullname.value.trim()) {
        displayError(fullname, 'Vui lòng nhập họ và tên', '.form-message-name');
        valid = false;
    }

    if (!phoneRegex.test(phone.value.trim())) {
        displayError(phone, 'Vui lòng nhập số điện thoại hợp lệ', '.form-message-phone');
        valid = false;
    } else if (userDatabase.some(u => u.phone === phone.value.trim())) {
        displayError(phone, 'Số điện thoại đã được đăng ký', '.form-message-phone');
        valid = false;
    }

    if (pass.value.length < 6) {
        displayError(pass, 'Mật khẩu tối thiểu 6 ký tự', '.form-message-password');
        valid = false;
    }

    if (confirm.value !== pass.value || !confirm.value) {
        displayError(confirm, 'Mật khẩu nhập lại không khớp', '.form-message-password-confi');
        valid = false;
    }

    if (!checkbox.checked) {
        displayError(null, 'Vui lòng đồng ý điều khoản', '.form-message-checkbox');
        valid = false;
    }

    if (valid) {
        userDatabase.push({
            phone: phone.value.trim(),
            password: pass.value,
            fullname: fullname.value.trim()
        });
    }
    return valid;
}

function validateLoginForm() {
    let valid = true;
    const loginInput = loginForm.querySelector('#phone-login'); // Đổi tên để dễ hiểu hơn
    const pass = loginForm.querySelector('#password-login');
    const msg = document.querySelector('.form-message-check-login');

    clearError(loginInput, '.form-message-login-phone');
    clearError(pass, '.form-message-check-login');
    msg.textContent = '';

    const inputValue = loginInput.value.trim();
    const passwordValue = pass.value.trim();

    if (!inputValue) {
        displayError(loginInput, 'Vui lòng nhập họ tên hoặc số điện thoại', '.form-message-login-phone');
        valid = false;
    }

    if (!passwordValue) {
        msg.textContent = 'Vui lòng nhập mật khẩu';
        pass.classList.add('is-invalid');
        valid = false;
    }

    if (!valid) return false;

    // Tìm kiếm người dùng bằng cả họ tên HOẶC số điện thoại, và mật khẩu phải khớp
    const user = userDatabase.find(u => 
        (u.fullname.toLowerCase() === inputValue.toLowerCase() || u.phone === inputValue) && 
        u.password === passwordValue
    );

    if (!user) {
        loginInput.classList.add('is-invalid');
        pass.classList.add('is-invalid');
        msg.textContent = 'Thông tin đăng nhập hoặc mật khẩu không đúng.';
        return false;
    }
    return true;
}

if (signupForm) {
    signupForm.addEventListener('submit', e => {
        e.preventDefault();
        if (validateSignupForm()) {
            alert('Đăng ký thành công!');
            switchToLogin();
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        if (validateLoginForm()) {
            alert('Đăng nhập thành công!');
            closeModal();
        }
    });
}

function showModal() {
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    loginModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    clearAllErrors();
}

function switchToSignup() {
    clearAllErrors();
    signupFormContainer.style.display = 'block';
    loginFormContainer.style.display = 'none';
    showModal();
}

function switchToLogin() {
    clearAllErrors();
    loginFormContainer.style.display = 'block';
    signupFormContainer.style.display = 'none';
    showModal();
}

loginLinks.forEach(l => l.addEventListener('click', switchToLogin));
signupLinks.forEach(l => l.addEventListener('click', switchToSignup));
closeButton.addEventListener('click', closeModal);
loginModal.addEventListener('click', e => { if (e.target === loginModal) closeModal(); });
if (loginSwitchLink) loginSwitchLink.addEventListener('click', switchToLogin);

if (mainMenuLogin && dropdownMenu) {
    mainMenuLogin.addEventListener('mouseenter', () => dropdownMenu.style.display = 'block');
    mainMenuLogin.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!dropdownMenu.matches(':hover')) dropdownMenu.style.display = 'none';
        }, 100);
    });
    dropdownMenu.addEventListener('mouseleave', () => dropdownMenu.style.display = 'none');
}





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


document.addEventListener('DOMContentLoaded', function () {
    // Đảm bảo productsData đã được tải trước đây
    if (typeof productsData !== 'undefined' && productsData.length > 0) {
        // Hiển thị trang đầu tiên khi trang tải xong
        changePage(currentPage);
    } else {
        // Xử lý khi không có dữ liệu sản phẩm
        console.error("Không tìm thấy dữ liệu sản phẩm (productsData).");
        renderProducts([]); // Hiển thị thông báo "Không có kết quả"
        renderPagination(0, 0);
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
                    <input type="text" placeholder="Nhập thông tin cần lưu ý...">
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
    console.log("Đang lọc theo danh mục:", categoryName);
    const filteredProducts = productsData.filter(product => product.category === categoryName);
    renderProducts(filteredProducts);
}