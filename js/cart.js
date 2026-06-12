document.addEventListener('DOMContentLoaded', function() {
    (async () => {
        await (window.ensureProductsLoaded ? window.ensureProductsLoaded() : Promise.resolve());
        renderCart();
    })();
});

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');

    if (cart.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        updateSummary(0, 0, 0);
        return;
    }

    if (emptyCart) emptyCart.style.display = 'none';

    if (container) {
        container.innerHTML = cart.map((item, index) => {
            const product = getProductById(item.productId);
            if (!product) return '';

            const itemTotal = product.price * item.quantity;

            return `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image" onclick="window.location.href='product.html?id=${product.id}'">
                        <img src="${product.image}" alt="${product.name}" loading="lazy" />
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-brand">${product.brand}</div>
                        <div class="cart-item-name" onclick="window.location.href='product.html?id=${product.id}'">${product.name}</div>
                        <div class="cart-item-variant">Размер: ${item.size} | Цвет: ${item.color || 'Не указан'}</div>
                        <div class="cart-item-price">${itemTotal.toLocaleString()} ₽</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="cart-item-remove" onclick="removeCartItem(${index})" title="Удалить">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <div class="cart-item-quantity">
                            <button class="cart-qty-btn" onclick="updateCartItemQty(${index}, -1)">−</button>
                            <input type="number" class="cart-qty-input" value="${item.quantity}" min="1" readonly />
                            <button class="cart-qty-btn" onclick="updateCartItemQty(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateSummary();
    const cartCountText = document.getElementById('cartCountText');
    if (cartCountText) {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountText.textContent = window.formatItemsCount ? window.formatItemsCount(count) : `${count} товаров`;
    }
}

function removeCartItem(index) {
    const cart = getCart();
    const item = cart[index];
    
    cart.splice(index, 1);
    saveCart(cart);
    
    const cartItem = document.querySelector(`[data-index="${index}"]`);
    if (cartItem) {
        cartItem.style.transform = 'translateX(-100%)';
        cartItem.style.opacity = '0';
        setTimeout(() => {
            renderCart();
        }, 300);
    } else {
        renderCart();
    }
    
    showToast('Товар удален из корзины', '');
}

function updateCartItemQty(index, change) {
    const cart = getCart();
    const item = cart[index];
    
    const newQty = item.quantity + change;
    if (newQty <= 0) {
        removeCartItem(index);
        return;
    }
    
    item.quantity = newQty;
    saveCart(cart);
    renderCart();
}

function updateSummary() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    let subtotal = 0;
    let totalDiscount = 0;

    cart.forEach(item => {
        const product = getProductById(item.productId);
        if (product) {
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            
            if (product.oldPrice) {
                const discount = (product.oldPrice - product.price) * item.quantity;
                totalDiscount += discount;
            }
        }
    });

    const delivery = subtotal >= 5000 ? 0 : 500;
    const total = subtotal - totalDiscount + delivery;

    const totalItemsEl = document.getElementById('totalItems');
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    
    const subtotalEl = document.getElementById('subtotal');
    if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString() + ' ₽';
    
    const discountEl = document.getElementById('discount');
    if (discountEl) discountEl.textContent = totalDiscount > 0 ? '-' + totalDiscount.toLocaleString() + ' ₽' : '0 ₽';
    
    const deliveryEl = document.getElementById('delivery');
    if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'Бесплатно' : delivery.toLocaleString() + ' ₽';
    
    const totalEl = document.getElementById('total');
    if (totalEl) totalEl.textContent = total.toLocaleString() + ' ₽';
}

function clearCartAndRender() {
    if (confirm('Вы уверены, что хотите очистить корзину?')) {
        clearCart();
        renderCart();
        showToast('Корзина очищена', '');
    }
}

function applyPromo() {
    const promoInput = document.getElementById('promoInput');
    const promoCode = promoInput ? promoInput.value.trim() : '';
    
    if (promoCode) {
        showToast('Промокод применен!', 'success');
        if (promoInput) promoInput.value = '';
    } else {
        showToast('Введите промокод', 'error');
    }
}

function checkout() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Корзина пуста', 'error');
        return;
    }

    if (typeof window.isUserLoggedIn === 'function' && !window.isUserLoggedIn()) {
        if (typeof window.setPostAuthRedirect === 'function') {
            window.setPostAuthRedirect('checkout.html');
        }
        showToast('Чтобы оформить заказ, войдите или зарегистрируйтесь', 'error');
        if (typeof window.openAuthModal === 'function') window.openAuthModal();
        return;
    }
    
    window.location.href = 'checkout.html';
}

window.removeCartItem = removeCartItem;
window.updateCartItemQty = updateCartItemQty;
window.clearCartAndRender = clearCartAndRender;
window.applyPromo = applyPromo;
window.checkout = checkout;
