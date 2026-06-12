let currentSlide = 0;
const totalSlides = 3;

function updateSlider() {
    const slider = document.getElementById('heroSlider');
    const dots = document.querySelectorAll('.hero-nav-dot');

    if (slider) {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
}

function goToSlide(index) {
    currentSlide = index;
    updateSlider();
}

let heroInterval;
function startHeroSlider() {
    heroInterval = setInterval(nextSlide, 5000);
}

function stopHeroSlider() {
    if (heroInterval) {
        clearInterval(heroInterval);
    }
}

function renderProducts(containerId, productList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = productList
        .map((product, index) => {
            const isFav = isFavorite(product.id);
            return `
                <div class="product-card" style="transition-delay: ${index * 0.1}s" onclick="window.location.href='product.html?id=${product.id}'">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        ${product.badge ? `<span class="product-badge ${product.badge}">${product.badge === 'sale' ? 'SALE' : 'NEW'}</span>` : ''}
                        <div class="product-wishlist ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)">
                            <svg viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </div>
                        <div class="product-actions">
                            <button class="product-action-btn" onclick="event.stopPropagation(); addToCartQuick(${product.id})">В корзину</button>
                        </div>
                    </div>
                    <div class="product-info">
                        <div class="product-brand">${product.brand}</div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">
                            <span class="current">${product.price.toLocaleString()} ₽</span>
                            ${product.oldPrice ? `<span class="old">${product.oldPrice.toLocaleString()} ₽</span>` : ''}
                            ${product.discount ? `<span class="discount">-${product.discount}%</span>` : ''}
                        </div>
                        <div class="product-colors">
                            ${product.colors.map((color, i) => `
                                <div class="color-dot ${i === 0 ? 'active' : ''}" style="background: ${color}; ${color === '#fff' || color === '#ffffff' ? 'border: 1px solid #ddd;' : ''}" onclick="event.stopPropagation(); selectColorDot(this, '${color}')"></div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');

    observeElements();
}

function selectColorDot(element, color) {
    document.querySelectorAll('.color-dot').forEach(dot => {
        if (dot.closest('.product-card') === element.closest('.product-card')) {
            dot.classList.remove('active');
        }
    });
    element.classList.add('active');
}

function toggleWishlist(productId, element) {
    const isFav = toggleFavorite(productId);

    if (element) {
        element.classList.toggle('active', isFav);
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = '';
        }, 300);
    }

    if (isFav) {
        showToast('Добавлено в избранное', 'success');
    } else {
        showToast('Удалено из избранного', '');
    }
}

function addToCartQuick(productId) {
    addToCart(productId, 'M', null, 1);
    showToast('Товар добавлен в корзину', 'success');
}

function observeElements() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        },
        { threshold: 0.1 }
    );

    document.querySelectorAll('.product-card').forEach((card) => {
        observer.observe(card);
    });
}

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goToSlide = goToSlide;
window.toggleWishlist = toggleWishlist;
window.addToCartQuick = addToCartQuick;
window.selectColorDot = selectColorDot;

document.addEventListener('DOMContentLoaded', async function() {
    await (window.ensureProductsLoaded ? window.ensureProductsLoaded() : Promise.resolve());

    const newProducts = getProducts({ badge: 'new' });
    const popularProducts = getProducts({ sort: 'popular' }).slice(0, 4);

    renderProducts('productsGrid', newProducts.slice(0, 4));
    renderProducts('popularGrid', popularProducts);

    startHeroSlider();

    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', stopHeroSlider);
        heroSection.addEventListener('mouseleave', startHeroSlider);
    }

    document.querySelectorAll('.hero-arrow, .hero-nav-dot').forEach(el => {
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });
});
