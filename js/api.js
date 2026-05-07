// API Configuration
const API_URL = 'http://localhost/btlWebbanhang/api/index.php'; // Thay đổi URL khi deploy
const AUTH_TOKEN_KEY = 'auth_token';

// Kiểm tra xem user đã đăng nhập chưa
function isLoggedIn() {
    return sessionStorage.getItem('user_id') !== null;
}

// Lấy thông tin user đăng nhập
function getCurrentUser() {
    return {
        id: sessionStorage.getItem('user_id'),
        name: sessionStorage.getItem('user_name'),
        email: sessionStorage.getItem('user_email')
    };
}

// ========== AUTH API ==========

// Đăng ký
async function signup(name, email, password, phone) {
    try {
        const response = await fetch(`${API_URL}/auth.php?action=signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                phone: phone
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            // Chuyển về trang đăng nhập
            // window.location.href = 'index.html';
        } else {
            alert('Lỗi: ' + data.message);
        }
        
        return data;
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        alert('Có lỗi xảy ra!');
    }
}

// Đăng nhập
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth.php?action=login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Lưu thông tin user vào session
            sessionStorage.setItem('user_id', data.user.id);
            sessionStorage.setItem('user_name', data.user.name);
            sessionStorage.setItem('user_email', data.user.email);
            
            alert('Đăng nhập thành công!');
            // Reload trang để cập nhật UI
            location.reload();
        } else {
            alert('Lỗi: ' + data.message);
        }
        
        return data;
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        alert('Có lỗi xảy ra!');
    }
}

// Đăng xuất
function logout() {
    sessionStorage.clear();
    alert('Đã đăng xuất!');
    location.reload();
}

// ========== PRODUCTS API ==========

// Lấy danh sách sản phẩm
async function getProducts(categoryId = null) {
    try {
        let url = `${API_URL}/products.php?action=list`;
        if (categoryId) {
            url += `&category_id=${categoryId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        return data.products || [];
    } catch (error) {
        console.error('Lỗi lấy sản phẩm:', error);
        return [];
    }
}

// Lấy chi tiết sản phẩm
async function getProductDetail(productId) {
    try {
        const response = await fetch(`${API_URL}/products.php?action=detail&id=${productId}`);
        const data = await response.json();
        
        return data.product || null;
    } catch (error) {
        console.error('Lỗi lấy chi tiết sản phẩm:', error);
        return null;
    }
}

// Lấy danh mục
async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/products.php?action=categories`);
        const data = await response.json();
        
        return data.categories || [];
    } catch (error) {
        console.error('Lỗi lấy danh mục:', error);
        return [];
    }
}

// ========== CART API ==========

// Lấy giỏ hàng
async function getCart() {
    if (!isLoggedIn()) {
        alert('Vui lòng đăng nhập trước!');
        return null;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart.php?action=list`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi lấy giỏ hàng:', error);
        return null;
    }
}

// Thêm vào giỏ hàng
async function addToCart(productId, quantity = 1) {
    if (!isLoggedIn()) {
        alert('Vui lòng đăng nhập trước!');
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart.php?action=add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Thêm vào giỏ hàng thành công!');
        } else {
            alert('Lỗi: ' + data.message);
        }
        
        return data.success;
    } catch (error) {
        console.error('Lỗi thêm vào giỏ hàng:', error);
        return false;
    }
}

// Cập nhật số lượng trong giỏ hàng
async function updateCartItem(productId, quantity) {
    if (!isLoggedIn()) return false;
    
    try {
        const response = await fetch(`${API_URL}/cart.php?action=update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Lỗi cập nhật giỏ hàng:', error);
        return false;
    }
}

// Xóa khỏi giỏ hàng
async function removeFromCart(productId) {
    if (!isLoggedIn()) return false;
    
    try {
        const response = await fetch(`${API_URL}/cart.php?action=remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                product_id: productId
            })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Lỗi xóa khỏi giỏ hàng:', error);
        return false;
    }
}

// Xóa toàn bộ giỏ hàng
async function clearCart() {
    if (!isLoggedIn()) return false;
    
    try {
        const response = await fetch(`${API_URL}/cart.php?action=clear`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Lỗi xóa giỏ hàng:', error);
        return false;
    }
}

// ========== ORDERS API ==========

// Lấy danh sách đơn hàng
async function getOrders() {
    if (!isLoggedIn()) return null;
    
    try {
        const response = await fetch(`${API_URL}/orders.php?action=list`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('Lỗi lấy đơn hàng:', error);
        return [];
    }
}

// Lấy chi tiết đơn hàng
async function getOrderDetail(orderId) {
    if (!isLoggedIn()) return null;
    
    try {
        const response = await fetch(`${API_URL}/orders.php?action=detail&order_id=${orderId}`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi lấy chi tiết đơn hàng:', error);
        return null;
    }
}

// Tạo đơn hàng
async function createOrder(shippingAddress, paymentMethod = 'cod') {
    if (!isLoggedIn()) {
        alert('Vui lòng đăng nhập trước!');
        return null;
    }
    
    try {
        const response = await fetch(`${API_URL}/orders.php?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                shipping_address: shippingAddress,
                payment_method: paymentMethod
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Tạo đơn hàng thành công!');
        } else {
            alert('Lỗi: ' + data.message);
        }
        
        return data;
    } catch (error) {
        console.error('Lỗi tạo đơn hàng:', error);
        return null;
    }
}
