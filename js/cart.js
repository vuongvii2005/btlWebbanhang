let cart = []; // lưu dữ liệu

function addToCart(productId) {
    const quantityInput = document.getElementById('quantityInput');
    const noteInput = document.querySelector('.modal-note input'); 
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    const note = noteInput ? noteInput.value.trim() : '';
    const existingProductIndex = cart.findIndex(item => item.id === productId);
    if (existingProductIndex > -1) {
        cart[existingProduct-index].quantity += quantity;
        if (note) {
            cart[existingProduct-index].note += `; ${note}`;
        }
    } else {
        // Nếu chưa có, tìm thông tin sản phẩm và thêm vào giỏ hàng
        const product = productsData.find(p => p.id === productId);
        if (product) {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                img: product.img,
                quantity: quantity, 
                note: note          
            });
        }
    }
    renderCart();
    alert('Đã thêm sản phẩm vào giỏ hàng!');

}

function renderCart() {
    const cartModal = document.getElementById('cartModal');
    const countProductCart = document.querySelector('.count-product-cart');

    if (cart.length === 0) {
        cartModal.innerHTML = `
            <div class="cart-header">
                <h3>Giỏ hàng</h3>
                <button class="close-cart-btn" onclick="closeCartModal()">&times;</button>
            </div>
            <p style="padding: 20px; text-align: center;">Giỏ hàng của bạn đang trống.</p>
        `;
        countProductCart.innerText = 0;
        return;
    }
    let totalAmount = 0;
    let cartHtml = `
        <div class="cart-header">
            <h3>Giỏ hàng</h3>
            <button class="close-cart-btn" onclick="closeCartModal()">&times;</button>
        </div>
        <ul class="cart-items-list">
    `;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        cartHtml += `
            <li class="cart-item">
                <img src="${item.img}" alt="${item.title}">
                <div class="item-info">
                    <p class="item-title">${item.title}(Số Lượng ${item.quantity})</p>
                    ${item.note ? `<p class="item-note">Ghi chú: ${item.note}</p>` : ''}
                </div>
                <div class="item-price">
                    <p>${new Intl.NumberFormat('vi-VN').format(itemTotal)} ₫</p>
                    <button class="remove-item-btn" onclick="removeFromCart(${item.id})">Xóa</button>
                </div>
            </li>
        `;
    });

    cartHtml += `
        </ul>
        <div class="cart-footer">
            <div class="total-section">
                <span>Tổng tiền:</span>
                <span class="total-amount">${new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫</span>
            </div>
            <div class="cart-actions">
                <button class="continue-shopping-btn" onclick="closeCartModal()">+ Thêm món</button>
                <button class="checkout-btn" onclick="goToCheckout()">Thanh toán</button>
            </div>
        </div>
    `;

    cartModal.innerHTML = cartHtml;
    countProductCart.innerText = cart.reduce((total, item) => total + item.quantity, 0);
}


function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
}

const openCartBtn = document.getElementById('openCartBtn');
const cartModal = document.getElementById('cartModal');
const cartOverlay = document.getElementById('cartModalOverlay');

function openCartModal() {
    renderCart(); 
    cartModal.classList.add('active'); 
    cartOverlay.style.display = 'block';
}

function closeCartModal() {
    cartModal.classList.remove('active'); 
    cartOverlay.style.display = 'none';
}

// Gắn sự kiện click
if (openCartBtn) {
    openCartBtn.addEventListener('click', openCartModal);
}
if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCartModal);
}