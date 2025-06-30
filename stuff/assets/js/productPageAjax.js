// Dynamic category map (categoryid -> name)
const categoryMap = {};

// App state
const state = {
    products: [],
    categories: [],      // Store categories array for rendering filters
    currentPage: 0,
    itemsPerPage: 6,
    filteredProducts: [],
    currentSort: 'featured'
};

// Check if product is new (added within 30 days)
function isNewProduct(datetime) {
    if (!datetime) return false;
    const productDate = new Date(datetime);
    const now = new Date();
    return (now - productDate) / (1000 * 60 * 60 * 24) <= 30;
}

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    try {
        await fetchCategories();
        await fetchProducts();
        renderCategoryFilters(state.categories);  // Render dynamic categories here
        renderProducts();
        setupEventListeners();
        updateFilterCount();
    } catch (err) {
        console.error('Failed to load data:', err);
        document.getElementById('productsGrid').innerHTML = '<p class="text-danger">Failed to load products. Please try again later.</p>';
    }
});

async function fetchCategories() {
    const cachedCategories = localStorage.getItem('categories');
    if (cachedCategories) {
        const categories = JSON.parse(cachedCategories);
        state.categories = categories;
        categories.forEach(cat => {
            if (cat.categoryid && cat.name) {
                categoryMap[cat.categoryid] = cat.name.toLowerCase();
            }
        });
        return; // skip fetch, use cached
    }

    const response = await fetch(`${API_BASE}/category`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (Array.isArray(result.data)) {
        state.categories = result.data;
        state.categories.forEach(cat => {
            if (cat.categoryid && cat.name) {
                categoryMap[cat.categoryid] = cat.name.toLowerCase();
            }
        });
        localStorage.setItem('categories', JSON.stringify(state.categories));
    }
}


async function fetchProducts() {
    const cachedProducts = localStorage.getItem('products');
    if (cachedProducts) {
        const products = JSON.parse(cachedProducts);
        state.products = products;
        state.filteredProducts = [...products];
        return; // skip fetch, use cached
    }

    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const rawProducts = result.data || [];

    state.products = rawProducts.map(product => {
        let imageUrl = 'assets/img/default-service-image.jpg';
        if (product.documents) {
            const docs = product.documents.split(',').map(s => s.trim());
            if (docs.length && docs[0] !== '') {
                imageUrl = `http://localhost:3000/uploads/${docs[0]}`;
            }
        }

        const price = product.price || 0;
        const datetime = product.datetime;
        const categoryName = categoryMap[product.categoryid] || 'other';

        return {
            id: product.productid,
            name: product.name || 'Unnamed Product',
            description: product.description || '',
            price: price,
            category: categoryName,
            image: imageUrl,
            featured: price >= 100,
            new: isNewProduct(datetime),
            best: price >= 50 && price < 100,
            special: price < 50
        };
    });

    state.filteredProducts = [...state.products];
    localStorage.setItem('products', JSON.stringify(state.products));
}


function renderCategoryFilters(categories) {
    const container = document.getElementById('categoryFilterSection');
    container.innerHTML = '<h6>Category</h6>'; // Clear and add header

    categories.forEach(cat => {
        const categoryValue = cat.name.toLowerCase();
        const checkboxId = `categoryFilter_${cat.categoryid}`;

        // Checkbox input
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.value = categoryValue;
        checkbox.id = checkboxId;

        // Label for checkbox
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = checkboxId;
        // You can customize icons per category if you want, else default icon:
        label.innerHTML = `<i class="fas fa-tag me-2"></i>${cat.name}`;

        // Wrapper div for checkbox and label
        const wrapper = document.createElement('div');
        wrapper.className = 'afrobuild_product_page_filter-checkbox';
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        container.appendChild(wrapper);
    });

    // Add event listeners for newly created checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            updateFilterCount();
            filterAndSort();
        });
    });
}

function setupEventListeners() {
    document.getElementById('filterBtn').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('filterDropdown').classList.toggle('show');
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.afrobuild_product_page_filter-dropdown') && !e.target.closest('#filterBtn')) {
            document.getElementById('filterDropdown').classList.remove('show');
        }
    });

    document.getElementById('searchInput').addEventListener('input', debounce(filterAndSort, 300));
    document.getElementById('priceRange').addEventListener('input', () => {
        document.getElementById('priceValue').textContent = document.getElementById('priceRange').value;
        filterAndSort();
    });

    // Attach event listeners to other checkboxes (budget, premium, rating etc)
    // We'll delegate category checkboxes separately in renderCategoryFilters
    document.querySelectorAll('#filterDropdown input[type="checkbox"]').forEach(input => {
        if (!input.id.startsWith('categoryFilter_')) {  // Avoid double-binding category checkboxes here
            input.addEventListener('change', () => {
                updateFilterCount();
                filterAndSort();
            });
        }
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.replace('btn-success', 'btn-outline-secondary'));
            this.classList.replace('btn-outline-secondary', 'btn-success');
            state.currentSort = this.dataset.sort;
            filterAndSort();
        });
    });

    document.getElementById('prevBtn').addEventListener('click', goToPreviousPage);
    document.getElementById('nextBtn').addEventListener('click', goToNextPage);
}

function filterAndSort() {
    const filters = getCurrentFilters();

    state.filteredProducts = state.products.filter(product => {
        return (
            matchesSearch(product, filters.searchTerm) &&
            matchesCategory(product, filters.selectedCategories) &&
            matchesPriceRange(product, filters.maxPrice, filters.budgetFriendly, filters.premium) &&
            matchesSpecialPrices(product, filters.budgetFriendly, filters.premium)
        );
    });

    sortProducts(state.filteredProducts, state.currentSort);
    state.currentPage = 0;
    renderProducts();
    updateActiveFiltersDisplay();
}

function getCurrentFilters() {
    return {
        searchTerm: document.getElementById('searchInput').value.toLowerCase(),
        selectedCategories: getSelectedCategories(),
        maxPrice: parseInt(document.getElementById('priceRange').value, 10),
        budgetFriendly: document.getElementById('budget').checked,
        premium: document.getElementById('premium').checked
    };
}

function getSelectedCategories() {
    const selected = [];
    document.querySelectorAll('#filterDropdown input[type="checkbox"]:checked').forEach(cb => {
        if (cb.value) selected.push(cb.value);
    });
    return selected;
}

function matchesSearch(product, searchTerm) {
    if (!searchTerm) return true;
    return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
}

function matchesCategory(product, selectedCategories) {
    return selectedCategories.length === 0 || selectedCategories.includes(product.category);
}

function matchesPriceRange(product, maxPrice, budgetFriendly, premium) {
    if (budgetFriendly || premium) return true;
    return product.price <= maxPrice;
}

function matchesSpecialPrices(product, budgetFriendly, premium) {
    if (budgetFriendly && premium) return product.price <= 75 || product.price >= 150;
    if (budgetFriendly) return product.price <= 75;
    if (premium) return product.price >= 150;
    return true;
}

function sortProducts(products, sortOption) {
    const sorters = {
        featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
        new: (a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0),
        best: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0),
        special: (a, b) => (b.special ? 1 : 0) - (a.special ? 1 : 0)
    };
    if (sorters[sortOption]) products.sort(sorters[sortOption]);
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const startIdx = state.currentPage * state.itemsPerPage;
    const endIdx = startIdx + state.itemsPerPage;
    const current = state.filteredProducts.slice(startIdx, endIdx);

    if (current.length > 0) {
        document.getElementById('noResults').style.display = 'none';
        grid.innerHTML = current.map(createProductCard).join('');
    } else {
        grid.innerHTML = '';
        document.getElementById('noResults').style.display = 'block';
    }

    updatePagination();
    updateProductCount();
}

function createProductCard(product) {
    return `
        <div class="col-lg-4 col-md-6">
            <div class="card h-100 border-0 shadow-sm afrobuild_product_page_product-card" style="border-radius: 15px; overflow: hidden;">
                <img src="${product.image}" class="card-img-top" style="height: 250px; object-fit: cover;" alt="${product.name}">
                <div class="card-body bg-white p-4">
                    <h5 class="card-title fw-bold mb-2">${product.name}</h5>
                    <p class="card-text text-muted small mb-3">${product.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-success">GH₵${product.price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>`;
}

function updatePagination() {
    const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
    const container = document.getElementById('paginationDots');

    // Clear existing dots if no pagination needed
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    // Generate dots for each page
    let dotsHtml = '';
    for (let i = 0; i < totalPages; i++) {
        const isActive = i === state.currentPage;
        dotsHtml += `
            <span
                class="rounded-circle d-inline-block me-2 ${isActive ? 'bg-success' : 'bg-secondary'}"
                style="
                    width: 12px;
                    height: 12px;
                    opacity: ${isActive ? '1' : '0.3'};
                    cursor: pointer;
                    transition: opacity 0.3s ease;
                "
                onclick="goToPage(${i})"
                aria-label="Go to page ${i + 1}"
                role="button"
                tabindex="0"
                onkeydown="if(event.key==='Enter' || event.key===' ') goToPage(${i});"
            ></span>
        `;
    }

    container.innerHTML = dotsHtml;
}


function updateProductCount() {
    const count = state.filteredProducts.length;
    const total = state.products.length;
    const text = count === total ? "Showing all products" : `Showing ${count} of ${total} products`;
    document.getElementById('productCount').textContent = text;
    document.getElementById('resultCount').textContent = text;
}

function goToPage(page) {
    state.currentPage = page;
    renderProducts();
}

function goToPreviousPage() {
    if (state.currentPage > 0) {
        state.currentPage--;
        renderProducts();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
    if (state.currentPage < totalPages - 1) {
        state.currentPage++;
        renderProducts();
    }
}

function updateFilterCount() {
    const active = document.querySelectorAll('#filterDropdown input:checked').length;
    const badge = document.getElementById('filterCount');
    badge.textContent = active;
    badge.style.display = active > 0 ? 'inline-block' : 'none';
    updateActiveFiltersDisplay();
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    const filters = getActiveFilters();
    container.innerHTML = filters.map(filter => `
        <div class="afrobuild_product_page_active-filter-tag">
            <span>${filter.label}</span>
            <button class="remove" onclick="removeFilter('${filter.type}', '${filter.id}')">×</button>
        </div>`).join('');
}

function getActiveFilters() {
    const filters = [];
    const current = getCurrentFilters();

    current.selectedCategories.forEach(cat => {
        const cb = document.querySelector(`#filterDropdown input[value="${cat}"]`);
        if (cb) {
            filters.push({ type: 'category', value: cat, label: cb.nextElementSibling.textContent.trim(), id: cb.id });
        }
    });

    if (current.budgetFriendly) filters.push({ type: 'price', value: '0-75', label: 'Budget Friendly', id: 'budget' });
    if (current.premium) filters.push({ type: 'price', value: '150+', label: 'Premium Products', id: 'premium' });
    if (current.searchTerm) filters.push({ type: 'search', value: current.searchTerm, label: `Search: "${current.searchTerm}"`, id: 'searchInput' });
    if (current.maxPrice < 200 && !(current.budgetFriendly || current.premium)) {
        filters.push({ type: 'priceRange', value: current.maxPrice, label: `Up to GH₵${current.maxPrice}`, id: 'priceRange' });
    }

    return filters;
}

function removeFilter(type, id) {
    if (type === 'search') {
        document.getElementById('searchInput').value = '';
    } else if (type === 'priceRange') {
        document.getElementById('priceRange').value = 200;
        document.getElementById('priceValue').textContent = '200';
    } else {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    }

    updateFilterCount();
    filterAndSort();
}

function applyFilters() {
    filterAndSort();
    document.getElementById('filterDropdown').classList.remove('show');
}

function clearFilters() {
    document.querySelectorAll('#filterDropdown input').forEach(input => {
        if (input.type === 'checkbox') input.checked = false;
        else input.value = '';
    });

    document.getElementById('searchInput').value = '';
    document.getElementById('priceRange').value = 200;
    document.getElementById('priceValue').textContent = '200';
    updateFilterCount();
    filterAndSort();
    document.getElementById('filterDropdown').classList.remove('show');
}

function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}
