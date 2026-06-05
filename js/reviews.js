const REVIEWS_PRODUCT_API = `${window.APP_API_URL}?controller=product`;
const REVIEWS_API = `${window.APP_API_URL}?controller=review`;
const REVIEWS_FALLBACK_IMAGE = 'assets/img/vy-food.png';
const REVIEWS_FALLBACK_AVATAR = 'assets/img/avt_mac_dinh.jpg';

const reviewsMoney = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
});

const reviewsState = {
    productId: 0,
    product: null,
    categories: [],
    reviews: [],
    summary: {
        total_reviews: 0,
        average_rating: 0,
        with_images: 0,
        positive_percent: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    },
    activeFilter: 'all'
};

function getReviewProductId() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get('product_id') || 0);
}

function reviewStars(rating = 0) {
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

function formatReviewDateTime(value) {
    if (!value) return '';

    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCategoryName(product) {
    const category = reviewsState.categories.find((item) => Number(item.id) === Number(product?.category_id));
    return category?.name || 'Món ăn';
}

function renderProductCard() {
    const product = reviewsState.product;
    const container = document.getElementById('reviewProductCard');
    if (!container || !product) return;

    document.getElementById('backToProduct').href = `index.html?product_id=${encodeURIComponent(product.id)}`;

    container.innerHTML = `
        <img class="review-product-image" src="${escapeHtml(product.image_url || REVIEWS_FALLBACK_IMAGE)}" alt="${escapeHtml(product.title || 'Món ăn')}" onerror="this.src='${REVIEWS_FALLBACK_IMAGE}'">
        <div class="review-product-info">
            <h2>${escapeHtml(product.title || 'Món ăn')}</h2>
            <p>${escapeHtml(product.description || '')}</p>
            <span class="review-category"><i class="fa-light fa-cube"></i> Danh mục: ${escapeHtml(getCategoryName(product))}</span>
        </div>
        <div class="review-product-action">
            <strong>${reviewsMoney.format(Number(product.price || 0))}</strong>
            <a class="reviews-primary-btn" href="index.html?product_id=${encodeURIComponent(product.id)}">
                <i class="fa-solid fa-cart-shopping"></i>
                Đặt món
            </a>
        </div>
    `;
}

function renderOverview() {
    const container = document.getElementById('reviewOverview');
    const summary = reviewsState.summary;
    const total = Number(summary.total_reviews || 0);
    const average = Number(summary.average_rating || 0);
    const breakdown = summary.breakdown || {};

    container.innerHTML = `
        <div class="review-score-box">
            <div>
                <strong>${average ? average.toFixed(1) : '0.0'}</strong>
                <span>/5</span>
            </div>
            <span class="review-stars big">${reviewStars(average)}</span>
            <p>${total} lượt đánh giá</p>
        </div>

        <div class="review-breakdown-box">
            ${[5, 4, 3, 2, 1].map((star) => {
                const count = Number(breakdown[star] || 0);
                const percent = total > 0 ? Math.round(count * 100 / total) : 0;

                return `
                    <div class="review-breakdown-row">
                        <span>${star} sao</span>
                        <div class="review-bar"><i style="width: ${percent}%"></i></div>
                        <em>${count} (${percent}%)</em>
                    </div>
                `;
            }).join('')}
        </div>

        <div class="review-happy-box">
            <i class="fa-light fa-star"></i>
            <div>
                <strong>Khách hàng hài lòng</strong>
                <span>${Number(summary.positive_percent || 0)}% đánh giá từ 4 sao trở lên</span>
            </div>
        </div>
    `;
}

function filterOptions() {
    const summary = reviewsState.summary;
    const breakdown = summary.breakdown || {};

    return [
        { key: 'all', label: `Tất cả (${Number(summary.total_reviews || 0)})` },
        { key: '5', label: `5 sao (${Number(breakdown[5] || 0)})` },
        { key: '4', label: `4 sao (${Number(breakdown[4] || 0)})` },
        { key: '3', label: `3 sao (${Number(breakdown[3] || 0)})` },
        { key: '2', label: `2 sao (${Number(breakdown[2] || 0)})` },
        { key: '1', label: `1 sao (${Number(breakdown[1] || 0)})` },
        { key: 'images', label: `Có hình ảnh (${Number(summary.with_images || 0)})`, icon: 'fa-image' }
    ];
}

function renderFilters() {
    const container = document.getElementById('reviewFilters');
    if (!container) return;

    container.innerHTML = `
        ${filterOptions().map((filter) => `
            <button class="review-filter-chip ${reviewsState.activeFilter === filter.key ? 'active' : ''}" type="button" data-review-filter="${filter.key}">
                ${filter.icon ? `<i class="fa-light ${filter.icon}"></i>` : ''}
                ${escapeHtml(filter.label)}
            </button>
        `).join('')}
        <button class="review-sort-chip" type="button">
            Mới nhất <i class="fa-light fa-chevron-down"></i>
        </button>
    `;

    container.querySelectorAll('[data-review-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            reviewsState.activeFilter = button.dataset.reviewFilter;
            renderFilters();
            renderReviewList();
        });
    });
}

function filteredReviews() {
    const filter = reviewsState.activeFilter;
    const reviews = [...reviewsState.reviews];

    if (filter === 'all') {
        return reviews;
    }

    if (filter === 'images') {
        return reviews.filter((review) => Array.isArray(review.images) && review.images.length > 0);
    }

    return reviews.filter((review) => Number(review.rating) === Number(filter));
}

function renderReviewList() {
    const container = document.getElementById('reviewList');
    const reviews = filteredReviews();

    if (!reviews.length) {
        container.innerHTML = `
            <div class="reviews-empty-state">
                <i class="fa-light fa-message-smile"></i>
                <strong>Chưa có đánh giá phù hợp</strong>
                <span>Hãy thử chọn bộ lọc khác.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map((review) => {
        const images = Array.isArray(review.images) ? review.images : [];

        return `
            <article class="review-row">
                <img class="review-avatar" src="${escapeHtml(review.user_avatar || REVIEWS_FALLBACK_AVATAR)}" alt="${escapeHtml(review.user_name || 'Khách hàng')}" onerror="this.src='${REVIEWS_FALLBACK_AVATAR}'">
                <div class="review-customer">
                    <strong>${escapeHtml(review.user_name || 'Khách hàng')}</strong>
                    <span>${escapeHtml(formatReviewDateTime(review.created_at))}</span>
                    <em><i class="fa-solid fa-circle-check"></i> Đã mua hàng</em>
                </div>
                <div class="review-content">
                    <span class="review-stars">${reviewStars(Number(review.rating || 0))}</span>
                    <p>${review.comment ? escapeHtml(review.comment) : 'Khách hàng không để lại bình luận.'}</p>
                    ${images.length ? `
                        <div class="review-images">
                            ${images.map((image) => `<img src="${escapeHtml(image)}" alt="Ảnh đánh giá">`).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="review-more-btn" type="button" aria-label="Tùy chọn">
                    <i class="fa-light fa-ellipsis-vertical"></i>
                </button>
            </article>
        `;
    }).join('');
}

async function loadReviewsPage() {
    reviewsState.productId = getReviewProductId();

    if (!reviewsState.productId) {
        document.getElementById('reviewProductCard').innerHTML = '<div class="reviews-loading">Không tìm thấy sản phẩm.</div>';
        return;
    }

    try {
        const [productResult, categoryResult, reviewResult] = await Promise.all([
            apiFetch(`${REVIEWS_PRODUCT_API}&action=detail&id=${encodeURIComponent(reviewsState.productId)}`),
            apiFetch(`${REVIEWS_PRODUCT_API}&action=categories`),
            apiFetch(`${REVIEWS_API}&action=list&product_id=${encodeURIComponent(reviewsState.productId)}`)
        ]);

        reviewsState.product = productResult.data || {};
        reviewsState.categories = Array.isArray(categoryResult.data) ? categoryResult.data : [];
        reviewsState.summary = reviewResult.data?.summary || reviewsState.summary;
        reviewsState.reviews = Array.isArray(reviewResult.data?.reviews) ? reviewResult.data.reviews : [];

        renderProductCard();
        renderOverview();
        renderFilters();
        renderReviewList();
    } catch (error) {
        document.getElementById('reviewProductCard').innerHTML = `
            <div class="reviews-loading">${escapeHtml(error.message || 'Không thể tải trang đánh giá.')}</div>
        `;
        document.getElementById('reviewOverview').innerHTML = '';
        document.getElementById('reviewFilters').innerHTML = '';
        document.getElementById('reviewList').innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', loadReviewsPage);
