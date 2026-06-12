window.Store = {
  products: null,
  loaded: false,
  loading: null,

  async load() {
    if (this.loaded && Array.isArray(this.products)) return this.products;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data && data.success) {
          this.products = data.products || [];
          this.loaded = true;
          return this.products;
        }
      } catch (e) {
        console.error('Ошибка загрузки товаров', e);
      }
      
      if (!this.products || this.products.length === 0) {
        this.products = [
          {
            id: 1,
            name: 'Элегантное платье миди',
            brand: 'YANKI',
            price: 8990,
            oldPrice: 12990,
            discount: 31,
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
            images: [
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop'
            ],
            badge: 'sale',
            category: 'Платья',
            colors: ['#000000', '#ffffff', '#c4a77d'],
            sizes: ['XS', 'S', 'M', 'L', 'XL'],
            description: 'Изысканное платье миди длины из премиального материала. Идеально подходит для особых случаев и повседневной носки. Классический силуэт с современными деталями. Платье выполнено из качественного трикотажа с добавлением эластана для идеальной посадки по фигуре.',
            rating: 4.8,
            reviewsCount: 124,
            inStock: true
          },
          {
            id: 2,
            name: 'Стильная блузка с воротником',
            brand: 'YANKI',
            price: 5490,
            image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop',
            images: [
              'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop'
            ],
            badge: 'new',
            category: 'Блузки',
            colors: ['#ffffff', '#000000', '#1e3a5f'],
            sizes: ['XS', 'S', 'M', 'L'],
            description: 'Элегантная блузка с классическим воротником и длинными рукавами. Универсальная модель, которая отлично сочетается с брюками, юбками и джинсами. Выполнена из натурального хлопка с добавлением эластана для комфорта.',
            rating: 4.6,
            reviewsCount: 89,
            inStock: true
          },
          {
            id: 3,
            name: 'Классические брюки прямого кроя',
            brand: 'YANKI',
            price: 6990,
            oldPrice: 8990,
            discount: 22,
            image: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
            images: [
              'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop'
            ],
            badge: 'sale',
            category: 'Брюки',
            colors: ['#000000', '#1e3a5f', '#8b4513'],
            sizes: ['S', 'M', 'L', 'XL'],
            description: 'Универсальные брюки прямого кроя из качественной ткани. Идеальный вариант для офиса и повседневной носки. Классический дизайн с современной посадкой. Брюки имеют стрелки и отлично держат форму благодаря качественному материалу.',
            rating: 4.7,
            reviewsCount: 156,
            inStock: true
          },
          {
            id: 4,
            name: 'Юбка-карандаш премиум',
            brand: 'YANKI',
            price: 6490,
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
            images: [
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop'
            ],
            badge: 'new',
            category: 'Юбки',
            colors: ['#000000', '#ffffff', '#8b0000'],
            sizes: ['XS', 'S', 'M', 'L', 'XL'],
            description: 'Элегантная юбка-карандаш длиной до колена. Классический силуэт, который подчеркивает женственность. Идеально подходит для делового стиля и особых случаев. Выполнена из плотной ткани с отличной посадкой.',
            rating: 4.9,
            reviewsCount: 203,
            inStock: true
          },
          {
            id: 5,
            name: 'Платье макси с цветочным принтом',
            brand: 'YANKI',
            price: 10990,
            oldPrice: 14990,
            discount: 27,
            image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop',
            images: [
              'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop'
            ],
            badge: 'sale',
            category: 'Платья',
            colors: ['#ffc0cb', '#ffffff', '#c4a77d'],
            sizes: ['S', 'M', 'L', 'XL'],
            description: 'Романтичное платье макси с нежным цветочным принтом. Свободный силуэт с завышенной талией. Идеально для летнего сезона и особых мероприятий. Платье выполнено из легкой воздушной ткани, которая не мнется и отлично драпируется.',
            rating: 4.5,
            reviewsCount: 78,
            inStock: true
          },
          {
            id: 6,
            name: 'Блузка с бантом',
            brand: 'YANKI',
            price: 5990,
            image: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
            images: [
              'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop'
            ],
            badge: 'new',
            category: 'Блузки',
            colors: ['#ffffff', '#000000', '#1e3a5f'],
            sizes: ['XS', 'S', 'M', 'L'],
            description: 'Женственная блузка с декоративным бантом на воротнике. Классический крой с современными деталями. Отлично сочетается с юбками и брюками. Выполнена из натурального шелка с добавлением эластана для комфортной посадки.',
            rating: 4.7,
            reviewsCount: 112,
            inStock: true
          }
        ];
      }
      
      this.loaded = true;
      return this.products;
    })();

    return this.loading;
  },

  getByIdSync(id) {
    if (!Array.isArray(this.products)) return null;
    const pid = parseInt(id, 10);
    return this.products.find(p => p.id === pid) || null;
  },

  querySync(filters = {}) {
    let products = Array.isArray(this.products) ? [...this.products] : [];

    if (filters.badge) {
      products = products.filter(p => p.badge === filters.badge);
    }

    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters.minPrice != null) {
      products = products.filter(p => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice != null) {
      products = products.filter(p => p.price <= Number(filters.maxPrice));
    }

    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'new':
          products.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0));
          break;
        case 'popular':
          products.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
          break;
        case 'sale':
          products.sort((a, b) => (b.badge === 'sale' ? 1 : 0) - (a.badge === 'sale' ? 1 : 0));
          break;
      }
    }

    return products;
  }
};

window.ensureProductsLoaded = () => window.Store.load();
window.getProductById = (id) => window.Store.getByIdSync(id);
window.getProducts = (filters) => window.Store.querySync(filters);
