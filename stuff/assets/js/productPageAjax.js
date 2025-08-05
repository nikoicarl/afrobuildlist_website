// Dynamic category map (categoryid -> name)
const categoryMap = {};
// Cart to store product ID and quantity (initially empty but managed per user)
const cart = {};
const userId = sessionStorage.getItem('userID');
const cacheKey = "cachedProducts";

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

        // Load cart from sessionStorage
        const savedCart = sessionStorage.getItem('cart');
        if (savedCart) {
            Object.assign(cart, JSON.parse(savedCart));
        }

        // Update cart count after loading the cart
        updateCartCount(userId); // This ensures the cart count is updated on page load

        updateFilterCount();
    } catch (err) {
        console.error('Failed to load data:', err);
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = '<p class="text-danger">Failed to load products. Please try again later.</p>';
        }
    }
});

async function fetchCategories() {
    const cachedCategories = sessionStorage.getItem('categories');
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

    const response = await fetch(`${API_BASE}/category/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (Array.isArray(result.data)) {
        state.categories = result.data;
        state.categories.forEach(cat => {
            if (cat.categoryid && cat.name) {
                categoryMap[cat.categoryid] = cat.name.toLowerCase();
            }
        });
        sessionStorage.setItem('categories', JSON.stringify(state.categories));
    }
}

async function fetchProducts() {
    const cachedProducts = sessionStorage.getItem(cacheKey);
    if (cachedProducts) {
        const products = JSON.parse(cachedProducts);
        state.products = products;
        state.filteredProducts = [...products];
        return; // skip fetch, use cached
    }

    const response = await fetch(`${API_BASE}/products/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const rawProducts = result.data || [];

    state.products = rawProducts.map(product => {
        let imageUrl = 'assets/img/default-service-image.jpg';
        if (product.documents) {
            const docs = product.documents.split(',').map(s => s.trim());
            if (docs.length && docs[0] !== '') {
                imageUrl = `/shared-uploads/${docs[0]}`;
            }
        }

        const price = product.price || 0;
        const datetime = product.datetime;

        return {
            productid: product.productid,
            name: product.name || 'Unnamed Product',
            description: product.description || 'No description provided.',
            price: price,
            category: product.categoryid,
            item_type: 'product',
            image: imageUrl,
            featured: price >= 100,
            new: isNewProduct(datetime),
            best: price >= 50 && price < 100,
            special: price < 50
        };
    });

    state.filteredProducts = [...state.products];
    sessionStorage.setItem('products', JSON.stringify(state.products));
}

function renderCategoryFilters(categories) {
    const container = document.getElementById('categoryFilterSection');
    if (!container) return;
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
        // Default icon for category
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
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const searchInput = document.getElementById('searchInput');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', e => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', e => {
        if (!e.target.closest('.afrobuild_product_page_filter-dropdown') && !e.target.closest('#filterBtn')) {
            filterDropdown.classList.remove('show');
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterAndSort, 300));
    }

    if (priceRange && priceValue) {
        priceRange.addEventListener('input', () => {
            priceValue.textContent = priceRange.value;
            filterAndSort();
        });
    }

    // Attach event listeners to checkboxes except categories (categories are handled in renderCategoryFilters)
    document.querySelectorAll('#filterDropdown input[type="checkbox"]').forEach(input => {
        if (!input.id.startsWith('categoryFilter_')) {  // Avoid double-binding category checkboxes here
            input.addEventListener('change', () => {
                updateFilterCount();
                filterAndSort();
            });
        }
    });

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.sort-btn').forEach(b => {
                b.classList.remove('text-white', 'active-sort');
                b.classList.add('btn-outline-secondary');
                b.style.backgroundColor = 'transparent';
                b.style.borderColor = ''; // Reset border
            });

            this.classList.remove('btn-outline-secondary');
            this.classList.add('text-white', 'active-sort');
            this.style.backgroundColor = 'var(--primary-color)';
            this.style.borderColor = 'var(--primary-color)';

            state.currentSort = this.dataset.sort;
            filterAndSort();
        });
    });

    // Pagination buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', goToPreviousPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);
}

function filterAndSort() {
    const filters = getCurrentFilters();
    // console.log('Filters applied:', filters);

    let filtered = state.products.filter(product => {
        return (
            matchesSearch(product, filters.searchTerm) &&
            matchesCategory(product, filters.selectedCategories) &&
            matchesPrice(product, filters.maxPrice, filters.budgetFriendly, filters.premium)
        );
    });
    // console.log('Filtered products count after main filters:', filtered.length);

    if (state.currentSort && ['featured', 'new', 'best', 'special'].includes(state.currentSort)) {
        filtered = filtered.filter(product => product[state.currentSort]);
        // console.log(`Filtered products count after filtering by sort= ${state.currentSort}:`, filtered.length);
    }

    sortProducts(filtered, state.currentSort);
    state.filteredProducts = filtered;
    state.currentPage = 0;
    renderProducts();
    updateActiveFiltersDisplay();
}

function getCurrentFilters() {
    const searchInput = document.getElementById('searchInput');
    const priceRange = document.getElementById('priceRange');
    const budgetCheckbox = document.getElementById('budget');
    const premiumCheckbox = document.getElementById('premium');

    return {
        searchTerm: searchInput ? searchInput.value.toLowerCase() : '',
        selectedCategories: getSelectedCategories(),
        maxPrice: priceRange ? parseInt(priceRange.value, 10) : 200,
        budgetFriendly: budgetCheckbox ? budgetCheckbox.checked : false,
        premium: premiumCheckbox ? premiumCheckbox.checked : false
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
    if (!searchTerm) return true; // No search term means always match

    const term = searchTerm.toLowerCase();

    // Prepare the fields to search
    const name = product.name ? product.name.toLowerCase() : "";
    const description = product.description ? product.description.toLowerCase() : "";
    const categoryName = categoryMap[product.category] || "";

    // Search in name, description, and mapped categoryName
    return (
        name.includes(term) ||
        description.includes(term) ||
        categoryName.includes(term)
    );
}

function matchesCategory(product, selectedCategories) {
    if (selectedCategories.length === 0) return true;
    // product.category might be a number, so compare as string
    return selectedCategories.includes(product.category.toString());
}

function matchesPrice(product, maxPrice, budgetFriendly, premium) {
    const price = product.price;

    if (budgetFriendly && premium) {
        // Show prices <= 75 or >= 150
        return price <= 75 || price >= 150;
    } else if (budgetFriendly) {
        return price <= 75;
    } else if (premium) {
        return price >= 150;
    } else {
        return price <= maxPrice;
    }
}

function sortProducts(products, sortOption) {
    // Sort so true flags come before false ones (descending)
    const sorters = {
        featured: (a, b) => (a.featured ? 1 : 0) - (b.featured ? 1 : 0),
        new: (a, b) => (a.new ? 1 : 0) - (b.new ? 1 : 0),
        best: (a, b) => (a.best ? 1 : 0) - (b.best ? 1 : 0),
        special: (a, b) => (a.special ? 1 : 0) - (b.special ? 1 : 0)
    };

    if (sorters[sortOption]) {
        products.sort(sorters[sortOption]);
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const startIdx = state.currentPage * state.itemsPerPage;
    const endIdx = startIdx + state.itemsPerPage;
    const current = state.filteredProducts.slice(startIdx, endIdx);

    if (current.length > 0) {
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = 'none';
        grid.innerHTML = current.map(createProductCard).join('');
    } else {
        grid.innerHTML = '';
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = 'block';
    }

    updatePagination();
    updateProductCount();
}

function createProductCard(product) {
    let docsArray = [];
    if (product.documents && product.documents.trim()) {
        docsArray = product.documents
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
    }
    const imageUrl = docsArray.length
        ? `/shared-uploads/${docsArray[0]}`
        : "assets/img/default-service-image.jpg";
    return `
        <div class="col-lg-4 col-md-6">
            <div class="card h-100 border-0 shadow-sm afrobuild_product_page_product-card" style="border-radius: 15px; overflow: hidden;">
                <img src="${imageUrl}" class="card-img-top afrobuild-product-card-image" style="height: 250px; object-fit: contain;width: 100%;" alt="${product.name}">
                <div class="card-body bg-white p-4">
                    <h5 class="card-title fw-bold mb-2">${product.name}</h5>
                    <p class="card-text text-muted small mb-3">${product.description || "No description provided."}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold afrobuild-product-price-amount">GH₵${product.price.toFixed(2)}</span>
                        <div>
                            <input type="number" id="quantity_${product.productid}" class="form-control" value="1" min="1" style="width: 60px;">
                            <button class="afrobuild-btn afrobuild-btn-success mt-2" onclick="addToCart(${product.productid})">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function updatePagination() {
    const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
    const container = document.getElementById('paginationDots');
    if (!container) return;

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
    const productCount = document.getElementById('productCount');
    const resultCount = document.getElementById('resultCount');
    if (productCount) productCount.textContent = text;
    if (resultCount) resultCount.textContent = text;
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
    const checkedInputs = document.querySelectorAll('#filterDropdown input:checked');
    const active = checkedInputs.length;
    const badge = document.getElementById('filterCount');
    if (badge) {
        badge.textContent = active;
        badge.style.display = active > 0 ? 'inline-block' : 'none';
    }
    updateActiveFiltersDisplay();
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
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
        const el = document.getElementById('searchInput');
        if (el) el.value = '';
    } else if (type === 'priceRange') {
        const pr = document.getElementById('priceRange');
        const pv = document.getElementById('priceValue');
        if (pr) pr.value = 200;
        if (pv) pv.textContent = '200';
    } else {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    }

    updateFilterCount();
    filterAndSort();
}

function applyFilters() {
    filterAndSort();
    const filterDropdown = document.getElementById('filterDropdown');
    if (filterDropdown) filterDropdown.classList.remove('show');
}

function clearFilters() {
    document.querySelectorAll('#filterDropdown input').forEach(input => {
        if (input.type === 'checkbox') input.checked = false;
        else input.value = '';
    });

    const searchInput = document.getElementById('searchInput');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    if (searchInput) searchInput.value = '';
    if (priceRange) priceRange.value = 200;
    if (priceValue) priceValue.textContent = '200';

    updateFilterCount();
    filterAndSort();

    const filterDropdown = document.getElementById('filterDropdown');
    if (filterDropdown) filterDropdown.classList.remove('show');
}

function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}

// Function to update cart count in the header
function updateCartCount(userId) {
    if (!userId) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Please log in",
                text: "You need to log in to add items to your cart.",
                icon: "warning",
                confirmButtonText: 'Login',
                cancelButtonText: 'Cancel',
                showCancelButton: true,
                customClass: {
                    confirmButton: 'afrobuild-btn-success'
                },
                buttonsStyling: true
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/login";
                }
            });
        } else {
            alert("Please log in to add items to your cart.");
        }
        return;
    }

    const userCart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};
    const count = Object.values(userCart).reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElem = document.getElementById('cartCount');

    if (cartCountElem) {
        cartCountElem.textContent = count;
        cartCountElem.style.display = count > 0 ? 'inline-block' : 'none';

        // Optional: Add bounce animation for instant feedback
        cartCountElem.classList.remove('cart-bounce');
        void cartCountElem.offsetWidth; // Trigger reflow to restart animation
        cartCountElem.classList.add('cart-bounce');
    }
}

// Function to add product to the cart
function addToCart(productId) {
    if (!userId) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Please log in",
                text: "You need to log in to add items to your cart.",
                icon: "warning",
                confirmButtonText: 'Login',
                cancelButtonText: 'Cancel',
                showCancelButton: true,
                customClass: {
                    confirmButton: 'afrobuild-btn-success'
                },
                buttonsStyling: true
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/login";
                }
            });
        } else {
            alert("Please log in to add items to your cart.");
        }
        return;
    }

    const quantityInput = document.getElementById(`quantity_${productId}`);
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 0;
    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity greater than 0.');
        return;
    }

    const product = getProductById(productId);
    if (!product) return;

    let userCart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};

    if (userCart[productId]) {
        userCart[productId].quantity += quantity;
        userCart[productId].totalPrice = userCart[productId].price * userCart[productId].quantity;
    } else {
        userCart[productId] = {
            productid: product.productid,
            name: product.name,
            category: product.category,
            item_type: 'product',
            price: product.price,
            quantity: quantity,
            totalPrice: product.price * quantity
        };
    }

    sessionStorage.setItem(`cart_${userId}`, JSON.stringify(userCart));
    updateCartCount(userId);

    Swal.fire({
        title: 'Added to Cart!',
        text: `${quantity} ${product.name} has been added to your cart.`,
        icon: 'success',
        confirmButtonText: 'Continue Shopping',
        cancelButtonText: 'Go to Cart',
        showCancelButton: true,
        customClass: {
            confirmButton: 'afrobuild-btn-success'
        },
        buttonsStyling: true,
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            window.location.href = '/cart'; // Redirect to cart if "Go to Cart" is clicked
        }
    });
}

// Function to get product details by ID
function getProductById(productId) {
    const product = state.products.find(product => product.productid === productId);
    if (!product) {
        console.error(`Product with ID ${productId} not found.`);
        return { name: 'Unknown Product' }; // Return a default fallback product if not found
    }
    return product;
}

// Function to update cart UI based on sessionStorage data
function updateCartUI() {
    if (!userId) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Please log in",
                text: "You need to log in to add items to your cart.",
                icon: "warning",
                confirmButtonText: 'Login',
                cancelButtonText: 'Cancel',
                showCancelButton: true,
                customClass: {
                    confirmButton: 'afrobuild-btn-success'
                },
                buttonsStyling: true
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/login";
                }
            });
        } else {
            alert("Please log in to add items to your cart.");
        }
        return;
    }

    const userCart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    // Clear existing cart items
    cartItemsContainer.innerHTML = '';

    // Populate cart items
    Object.keys(userCart).forEach(productId => {
        const item = userCart[productId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');
        itemDiv.innerHTML = `
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-quantity">Quantity: ${item.quantity}</div>
            <div class="cart-item-price">Price: ₵${item.price.toFixed(2)}</div>
            <div class="cart-item-total">Total: ₵${item.totalPrice.toFixed(2)}</div>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

    // Update cart summary (total price)
    const totalPrice = Object.values(userCart).reduce((sum, item) => sum + item.totalPrice, 0);
    const totalPriceElem = document.getElementById('totalPrice');
    if (totalPriceElem) totalPriceElem.textContent = `₵${totalPrice.toFixed(2)}`;
}
