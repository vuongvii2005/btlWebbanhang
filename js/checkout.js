// 🔌 API Configuration
const API_URL = 'http://localhost/btlWebbanhang/api/index.php';

// 📡 API Helper Function
async function apiCall(controller, action, data = null, method = 'GET', token = null) {
    let url = `${API_URL}?controller=${controller}&action=${action}`;
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message || 'API Error');
    }
    
    return result.data;
}

// Chờ trang tải xong rồi mới chạy code
window.onload = function() {
    const cartDataString = localStorage.getItem('shoppingCart');
    if (!cartDataString) {
        document.querySelector('.checkout-container').innerHTML = '<h1>Giỏ hàng trống!</h1><a href="index.html">Quay lại mua hàng</a>';
        return;
    }

    const cart = JSON.parse(cartDataString);

    // --- Lấy ra các phần tử HTML cần thiết ---
    const itemsContainer = document.getElementById('summary-items');
    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');
    const shippingFeeRow = document.getElementById('shipping-fee-row');
    const btnDelivery = document.getElementById('btn-delivery');
    const btnPickup = document.getElementById('btn-pickup');
    
    const shippingFee = 30000; // Phí ship cố định
    let subtotal = 0;

    // Hiển thị các sản phẩm trong giỏ hàng
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('summary-item');
        itemDiv.innerHTML = `
            <span>${item.quantity}x ${item.title}</span>
            <span>${new Intl.NumberFormat('vi-VN').format(item.price)} ₫</span>
        `;
        itemsContainer.appendChild(itemDiv);
    });

    // Tính tổng tiền
    function updateTotal(currentShippingFee) {
        const total = subtotal + currentShippingFee;
        
        shippingEl.innerText = `${new Intl.NumberFormat('vi-VN').format(currentShippingFee)} ₫`;
        subtotalEl.innerText = `${new Intl.NumberFormat('vi-VN').format(subtotal)} ₫`;
        totalEl.innerText = `${new Intl.NumberFormat('vi-VN').format(total)} ₫`;
    }
    // Khi click "Giao tận nơi"
    btnDelivery.addEventListener('click', function() {
        btnDelivery.classList.add('active');
        btnPickup.classList.remove('active');
        shippingFeeRow.style.display = 'flex';
        updateTotal(shippingFee);
    });

    // Khi click "Tự đến lấy"
    btnPickup.addEventListener('click', function() {
        btnPickup.classList.add('active');
        btnDelivery.classList.remove('active');
        shippingFeeRow.style.display = 'none';
        updateTotal(0);
    });
    
    const btnToday = document.getElementById('date-today');
    const btnTomorrow = document.getElementById('date-tomorrow');
    const btnDayAfter = document.getElementById('date-day-after');
    const dateButtons = [btnToday, btnTomorrow, btnDayAfter];

    // Dùng vòng lặp để gắn cùng một hành động cho mỗi nút
    dateButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Xóa lớp 'active' khỏi TẤT CẢ các nút trong nhóm
            dateButtons.forEach(btn => btn.classList.remove('active'));
            
            //Thêm lớp 'active' CHỈ cho nút vừa được click
            this.classList.add('active'); // 'this' ở đây chính là cái nút được click
        });
    });

    // --- TÍNH TOÁN TỔNG TIỀN BAN ĐẦU ---
    // Mặc định ban đầu là giao tận nơi
    updateTotal(shippingFee); 
};


// hàm này được gọi khi nhấn nút "Đặt hàng"
function placeOrder() {
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerAddress = document.getElementById('customer-address').value;

    if (!customerName || !customerPhone || !customerAddress) {
        alert('Vui lòng điền đầy đủ thông tin người nhận!');
        return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('Bạn cần đăng nhập để đặt hàng!');
        window.location.href = 'index.html';
        return;
    }

    // 🔌 Call API to create order
    (async () => {
        try {
            const cart = JSON.parse(localStorage.getItem('shoppingCart'));
            
            // Get delivery settings
            const btnDelivery = document.getElementById('btn-delivery');
            const shippingFee = btnDelivery.classList.contains('active') ? 30000 : 0;
            
            const deliveryDate = document.getElementById('date-today').classList.contains('active') 
                ? new Date().toISOString().split('T')[0]
                : null;

            // Calculate total
            let subtotal = 0;
            cart.forEach(item => {
                subtotal += item.price * item.quantity;
            });
            const totalAmount = subtotal + shippingFee;

            const order = await apiCall('orders', 'create', {
                customer_name: customerName,
                phone: customerPhone,
                address: customerAddress,
                delivery_type: btnDelivery.classList.contains('active') ? 'delivery' : 'pickup',
                delivery_date: deliveryDate,
                total_amount: totalAmount,
                shipping_fee: shippingFee,
                items: cart,
                notes: document.getElementById('order-notes')?.value || ''
            }, 'POST', token);
            
            alert(`Cảm ơn ${customerName} đã đặt hàng! Mã đơn: ${order.order_id}`);
            
            // Clear cart and redirect
            localStorage.removeItem('shoppingCart');
            window.location.href = 'index.html';
            
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    })();
}