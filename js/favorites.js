document.addEventListener('DOMContentLoaded', function() {
    (async () => {
        await (window.ensureProductsLoaded ? window.ensureProductsLoaded() : Promise.resolve());
        renderFavorites();
    })();
});

function renderFavorites() {
    const favorites = getFavorites();
    const container = document.getElementById('favoritesGrid');
    const emptyFavorites = document.getElementById('emptyFavorites');

    if (favorites.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyFavorites) emptyFavorites.style.display = 'block';
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) favoritesCount.textContent = window.formatItemsCount ? window.formatItemsCount(0) : '0 товаров';
        return;
    }

    if (emptyFavorites) emptyFavorites.style.display = 'none';

    const favoriteProducts = favorites.map(id => getProductById(id)).filter(p => p);

    if (container) {
        container.innerHTML = favoriteProducts.map((product, index) => {
            return `
                <div class="favorite-card product-card" style="transition-delay: ${index * 0.1}s" onclick="window.location.href='product.html?id=${product.id}'">
                    <div class="remove-favorite" onclick="event.stopPropagation(); removeFavorite(${product.id})" title="Удалить из избранного">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </div>
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        ${product.badge ? `<span class="product-badge ${product.badge}">${product.badge === 'sale' ? 'SALE' : 'NEW'}</span>` : ''}
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
                    </div>
                </div>
            `;
        }).join('');
    }

    const favoritesCount = document.getElementById('favoritesCount');
    if (favoritesCount) {
        const count = favoriteProducts.length;
        favoritesCount.textContent = window.formatItemsCount ? window.formatItemsCount(count) : `${count} товаров`;
    }

    observeElements();
}

function removeFavorite(productId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
        
        const card = event.target.closest('.favorite-card');
        if (card) {
            card.style.transform = 'scale(0.8)';
            card.style.opacity = '0';
            setTimeout(() => {
                renderFavorites();
            }, 300);
        } else {
            renderFavorites();
        }
        
        showToast('Удалено из избранного', '');
    }
}

function addToCartQuick(productId) {
    addToCart(productId, 'M', null, 1);
    showToast('Товар добавлен в корзину', 'success');
}

function addAllToCart() {
    const favorites = getFavorites();
    let added = 0;
    
    favorites.forEach(id => {
        const product = getProductById(id);
        if (product) {
            addToCart(id, 'M', null, 1);
            added++;
        }
    });
    
    if (added > 0) {
        const text = window.formatItemsCount ? window.formatItemsCount(added) : `${added} товаров`;
        showToast(`Добавлено ${text} в корзину!`, 'success');
    } else {
        showToast('Нет товаров для добавления', 'error');
    }
}

function shareFavorites() {
    const favorites = getFavorites();
    if (favorites.length === 0) {
        showToast('Избранное пусто', 'error');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'Мое избранное из YANKI',
            text: `Посмотрите мои избранные товары из YANKI!`,
            url: window.location.href
        }).catch(() => {
            showToast('Функция поделиться недоступна', 'error');
        });
    } else {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showToast('Ссылка скопирована в буфер обмена', 'success');
        }).catch(() => {
            showToast('Не удалось скопировать ссылку', 'error');
        });
    }
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

    document.querySelectorAll('.favorite-card').forEach((card) => {
        observer.observe(card);
    });
}

window.removeFavorite = removeFavorite;
window.addToCartQuick = addToCartQuick;
window.addAllToCart = addAllToCart;
window.shareFavorites = shareFavorites;
