let currentProduct = null;
let selectedSize = 'M';
let selectedColor = null;
let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    (async () => {
        await (window.ensureProductsLoaded ? window.ensureProductsLoaded() : Promise.resolve());

        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (productId) {
            loadProduct(parseInt(productId));
        } else {
            showToast('Товар не найден', 'error');
            setTimeout(() => window.location.href = 'catalog.html', 2000);
        }
    })();
});

function loadProduct(id) {
    currentProduct = getProductById(id);
    
    if (!currentProduct) {
        showToast('Товар не найден', 'error');
        setTimeout(() => window.location.href = 'catalog.html', 2000);
        return;
    }

    selectedColor = currentProduct.colors[0];
    renderProduct();
}

function renderProduct() {
    const container = document.getElementById('productContainer');
    if (!container) return;
    
    const isFav = isFavorite(currentProduct.id);
    const images = Array.isArray(currentProduct.images) && currentProduct.images.length
        ? currentProduct.images
        : [currentProduct.image];
    const mainImage = images[0];

    container.innerHTML = `
        <div class="product-gallery">
            ${images.length > 1 ? `
            <div class="gallery-thumbs">
                ${images.map((img, index) => `
                    <div class="gallery-thumb ${index === 0 ? 'active' : ''}" onclick="changeMainImage(${index})">
                        <img src="${img}" alt="${currentProduct.name} миниатюра ${index + 1}" />
                    </div>
                `).join('')}
            </div>
            ` : ''}
            <div class="gallery-main">
                <img src="${mainImage}" alt="${currentProduct.name}" id="mainProductImage" />
                ${images.length > 1 ? `
                <div class="gallery-nav">
                    ${images.map((_, index) => `
                        <div class="gallery-dot ${index === 0 ? 'active' : ''}" onclick="changeMainImage(${index})"></div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
        <div class="product-details">
            <div class="product-detail-brand">${currentProduct.brand}</div>
            <h1 class="product-detail-name">${currentProduct.name}</h1>
            <div class="product-rating">
                <div class="stars">
                    ${Array(5).fill(0).map((_, i) => `
                        <svg viewBox="0 0 24 24" class="${i < Math.floor(currentProduct.rating) ? '' : 'empty'}">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    `).join('')}
                </div>
                <span class="rating-count">${currentProduct.reviewsCount} отзывов</span>
            </div>
            <div class="product-detail-price">
                <span class="current">${currentProduct.price.toLocaleString()} ₽</span>
                ${currentProduct.oldPrice ? `<span class="old">${currentProduct.oldPrice.toLocaleString()} ₽</span>` : ''}
                ${currentProduct.discount ? `<span class="discount">-${currentProduct.discount}%</span>` : ''}
            </div>
            <p class="product-description">${currentProduct.description}</p>

            <div class="product-options">
                <div class="option-title">
                    Размер: <span id="selectedSize">${selectedSize}</span>
                </div>
                <div class="size-options">
                    ${currentProduct.sizes.map(size => `
                        <div class="size-option ${size === selectedSize ? 'active' : ''} ${!currentProduct.inStock ? 'disabled' : ''}" 
                             onclick="selectSize('${size}')">${size}</div>
                    `).join('')}
                </div>

                <div class="option-title">Цвет: <span id="selectedColor">${getColorName(selectedColor)}</span></div>
                <div class="color-options">
                    ${currentProduct.colors.map((color, index) => `
                        <div class="color-option ${index === 0 ? 'active' : ''}" 
                             style="background: ${color}" 
                             onclick="selectColor('${color}')"
                             title="${getColorName(color)}"></div>
                    `).join('')}
                </div>
            </div>

            <div class="quantity-selector">
                <span class="quantity-label">Количество:</span>
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="decreaseQty()">−</button>
                    <input type="number" class="quantity-input" value="1" min="1" id="productQty" />
                    <button class="quantity-btn" onclick="increaseQty()">+</button>
                </div>
            </div>

            <div class="product-actions-detail">
                <button class="add-to-cart-btn" onclick="addToCartFromProduct()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    Добавить в корзину
                </button>
                <button class="wishlist-btn-detail ${isFav ? 'active' : ''}" onclick="toggleWishlistProduct()">
                    <svg viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            </div>

            <div class="product-meta">
                <div class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    Бесплатная доставка от 5 000 ₽
                </div>
                <div class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Возврат в течение 14 дней
                </div>
                <div class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Гарантия качества
                </div>
            </div>
        </div>
    `;

    const productBreadcrumb = document.getElementById('productBreadcrumb');
    if (productBreadcrumb) productBreadcrumb.textContent = currentProduct.name;
    
    const productDescription = document.getElementById('productDescription');
    if (productDescription) productDescription.textContent = currentProduct.description;
    
    const productDetails = document.getElementById('productDetails');
    if (productDetails) {
        productDetails.innerHTML = `
            <li>Состав: 95% полиэстер, 5% эластан</li>
            <li>Длина: 110 см (размер M)</li>
            <li>Страна производства: Италия</li>
            <li>Уход: машинная стирка при 30°C</li>
        `;
    }
}

function changeMainImage(index) {
    currentImageIndex = index;
    const mainImage = document.getElementById('mainProductImage');
    const thumbs = document.querySelectorAll('.gallery-thumb');
    const dots = document.querySelectorAll('.gallery-dot');

    if (mainImage) {
        mainImage.style.opacity = '0';
        mainImage.style.transform = 'scale(0.95)';
        setTimeout(() => {
            mainImage.src = currentProduct.images[index];
            mainImage.style.opacity = '1';
            mainImage.style.transform = 'scale(1)';
        }, 200);
    }

    thumbs.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function selectSize(size) {
    if (!currentProduct || !currentProduct.inStock) return;
    
    selectedSize = size;
    const selectedSizeEl = document.getElementById('selectedSize');
    if (selectedSizeEl) selectedSizeEl.textContent = size;
    
    document.querySelectorAll('.size-option').forEach(opt => {
        opt.classList.toggle('active', opt.textContent === size);
    });
}

function selectColor(color) {
    selectedColor = color;
    const selectedColorEl = document.getElementById('selectedColor');
    if (selectedColorEl) selectedColorEl.textContent = getColorName(color);
    
    document.querySelectorAll('.color-option').forEach((opt, index) => {
        opt.classList.toggle('active', currentProduct.colors[index] === color);
    });
}

function getColorName(color) {
    const colorMap = {
        '#000': 'Черный',
        '#000000': 'Черный',
        '#fff': 'Белый',
        '#ffffff': 'Белый',
        '#c4a77d': 'Бежевый',
        '#1e3a5f': 'Синий',
        '#8b0000': 'Красный',
        '#ffc0cb': 'Розовый',
        '#8b4513': 'Коричневый'
    };
    return colorMap[color] || 'Выбранный';
}

function increaseQty() {
    const input = document.getElementById('productQty');
    if (input) {
        input.value = parseInt(input.value) + 1;
        input.style.transform = 'scale(1.1)';
        setTimeout(() => {
            input.style.transform = '';
        }, 200);
    }
}

function decreaseQty() {
    const input = document.getElementById('productQty');
    if (input && parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        input.style.transform = 'scale(0.9)';
        setTimeout(() => {
            input.style.transform = '';
        }, 200);
    }
}

function addToCartFromProduct() {
    const quantityInput = document.getElementById('productQty');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    addToCart(currentProduct.id, selectedSize, selectedColor, quantity);
    showToast('Товар добавлен в корзину', 'success');
    
    const btn = document.querySelector('.add-to-cart-btn');
    if (btn) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 200);
    }
}

function toggleWishlistProduct() {
    const btn = document.querySelector('.wishlist-btn-detail');
    const isFav = toggleFavorite(currentProduct.id);

    if (btn) {
        btn.classList.toggle('active', isFav);
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 300);
    }

    if (isFav) {
        showToast('Добавлено в избранное', 'success');
    } else {
        showToast('Удалено из избранного', '');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const tabContent = document.getElementById('tab-' + tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

window.changeMainImage = changeMainImage;
window.selectSize = selectSize;
window.selectColor = selectColor;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.addToCartFromProduct = addToCartFromProduct;
window.toggleWishlistProduct = toggleWishlistProduct;
window.switchTab = switchTab;
