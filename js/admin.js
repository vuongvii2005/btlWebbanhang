
const adminAccount = {
    username: 'admin',
    password: 'admin123'
};
const adminForm = document.getElementById('admin-login-form');
if (adminForm) {
    adminForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const usernameInput = document.getElementById('admin-user').value;
        const passwordInput = document.getElementById('admin-pass').value;
        const errorMessageEl = document.getElementById('error-message');

        // Kiểm tra thông tin đăng nhập
        if (usernameInput === adminAccount.username && passwordInput === adminAccount.password) {
            // Đăng nhập thành công
            alert('Đăng nhập admin thành công!');
            
            // Chuyển hướng đến trang quản lý (ví dụ: dashboard.html)
            window.location.href = 'dashboard.html'; 
        } else {
            // Đăng nhập thất bại
            errorMessageEl.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        }
    });
}