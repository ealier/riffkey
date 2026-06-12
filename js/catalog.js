let currentPage = 1;
const itemsPerPage = 12;
let currentFilters = {};
let currentSort = 'popular';

document.addEventListener('DOMContentLoaded', async function() {
    await (window.ensureProductsLoaded ? window.ensureProductsLoaded() : Promise.resolve());

    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    const searchParam = urlParams.get('search');

    if (filterParam) {
        currentFilters.badge = filterParam;
    }

    if (searchParam) {
        currentFilters.search = searchParam;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = searchParam;
    }

    // Инициализация групп фильтров - все открыты по умолчанию
    const filterGroups = document.querySelectorAll('.filter-group');
    filterGroups.forEach(group => {
        const title = group.querySelector('.filter-title');
        const content = group.querySelector('.filter-options, .price-range, .filter-sizes, .filter-colors');
        if (title && content) {
            // Убеждаемся, что группы открыты по умолчанию
            title.classList.remove('collapsed');
            if (content.classList.contains('filter-options')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '200px';
            }
            content.style.opacity = '1';
        }
    });

    applyFilters();
});

function toggleFilterGroup(element) {
    element.classList.toggle('collapsed');
    const options = element.nextElementSibling;
    if (options) {
        if (element.classList.contains('collapsed')) {
            options.style.maxHeight = '0';
            options.style.opacity = '0';
            options.style.overflow = 'hidden';
        } else {
            options.style.maxHeight = options.scrollHeight + 'px';
            options.style.opacity = '1';
            setTimeout(() => {
                options.style.overflow = '';
            }, 300);
        }
    }
}

function toggleFilterOption(element) {
    const parent = element.closest('.filter-options');
    if (parent) {
        parent.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
    }
    element.classList.add('active');
    applyFilters();
}

function toggleFilterSize(element) {
    element.classList.toggle('active');
    applyFilters();
}

function toggleFilterColor(element) {
    element.classList.toggle('active');
    applyFilters();
}

function applyFilters() {
    currentFilters = {};

    // Проверяем параметр поиска из URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
        currentFilters.search = searchParam;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchParam;
            searchInput.parentElement.classList.add('has-value');
        }
    }

    const activeCategory = document.querySelector('.filter-option.active');
    if (activeCategory && activeCategory.textContent.trim() !== 'Все товары') {
        const categoryMap = {
            'Платья': 'Платья',
            'Блузки': 'Блузки',
            'Брюки': 'Брюки',
            'Юбки': 'Юбки'
        };
        currentFilters.category = categoryMap[activeCategory.textContent.trim()];
    }

    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice && minPrice.value) currentFilters.minPrice = parseInt(minPrice.value);
    if (maxPrice && maxPrice.value) currentFilters.maxPrice = parseInt(maxPrice.value);

    currentFilters.sort = currentSort;

    currentPage = 1;
    renderProducts();
}

function resetFilters() {
    document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
    document.querySelectorAll('.filter-size').forEach(size => size.classList.remove('active'));
    document.querySelectorAll('.filter-color').forEach(color => color.classList.remove('active'));
    document.querySelector('.filter-option')?.classList.add('active');
    document.querySelectorAll('.filter-size').forEach((size, i) => {
        if (i === 1 || i === 2) size.classList.add('active');
    });
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice) minPrice.value = 1000;
    if (maxPrice) maxPrice.value = 15000;
    currentFilters = {};
    currentSort = 'popular';
    currentPage = 1;
    renderProducts();
}

function toggleSortMenu() {
    const dropdown = document.getElementById('sortDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function selectSort(sortType) {
    currentSort = sortType;
    document.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    const dropdown = document.getElementById('sortDropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    const sortLabels = {
        'popular': 'Популярные',
        'new': 'Новинки',
        'price_asc': 'Цена: по возрастанию',
        'price_desc': 'Цена: по убыванию',
        'sale': 'Скидки'
    };
    
    const sortBtn = document.querySelector('.sort-btn');
    if (sortBtn) {
        sortBtn.innerHTML = `
            Сортировка: ${sortLabels[sortType]}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
            </svg>
        `;
    }
    
    applyFilters();
}

function setGridView() {
    const grid = document.getElementById('catalogGrid');
    if (grid) grid.classList.remove('list-view');
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('.view-btn')?.classList.add('active');
    }
}

function setListView() {
    const grid = document.getElementById('catalogGrid');
    if (grid) grid.classList.add('list-view');
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('.view-btn')?.classList.add('active');
    }
}

function renderProducts() {
    const products = getProducts(currentFilters);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);

    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    
    grid.innerHTML = paginatedProducts.map((product, index) => {
        const isFav = isFavorite(product.id);
        return `
            <div class="product-card" style="transition-delay: ${index * 0.05}s" onclick="window.location.href='product.html?id=${product.id}'">
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
    }).join('');

    const catalogCount = document.getElementById('catalogCount');
    if (catalogCount) {
        const count = products.length;
        catalogCount.textContent = window.formatItemsCount ? window.formatItemsCount(count) : `${count} товаров`;
    }

    renderPagination(totalPages);
    observeElements();
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    paginationHTML += `
        <button class="pagination-btn arrow" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6" />
            </svg>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<button class="pagination-btn" disabled>...</button>`;
        }
    }

    paginationHTML += `
        <button class="pagination-btn arrow" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </button>
    `;

    pagination.innerHTML = paginationHTML;
}

function goToPage(page) {
    const products = getProducts(currentFilters);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

function selectColorDot(element, color) {
    document.querySelectorAll('.color-dot').forEach(dot => {
        if (dot.closest('.product-card') === element.closest('.product-card')) {
            dot.classList.remove('active');
        }
    });
    element.classList.add('active');
}

window.toggleFilterGroup = toggleFilterGroup;
window.toggleFilterOption = toggleFilterOption;
window.toggleFilterSize = toggleFilterSize;
window.toggleFilterColor = toggleFilterColor;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.toggleSortMenu = toggleSortMenu;
window.selectSort = selectSort;
window.setGridView = setGridView;
window.setListView = setListView;
window.goToPage = goToPage;
window.toggleWishlist = toggleWishlist;
window.addToCartQuick = addToCartQuick;
window.selectColorDot = selectColorDot;

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

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('sortDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

document.querySelectorAll('[role="button"]').forEach(btn => {
    btn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        }
    });
});
