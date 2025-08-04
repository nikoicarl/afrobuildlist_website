// Dynamic category map (categoryid -> name)
const categoryMap = {};
// Cart to store service ID and quantity (initially empty but managed per user)
const cart = {};
const userId = sessionStorage.getItem('userID');
const cacheKey = "cachedServices";

// App state
const state = {
    services: [],
    categories: [],      // Store categories array for rendering filters
    currentPage: 0,
    itemsPerPage: 6,
    filteredServices: [],
    currentSort: 'featured'
};

// Check if service is new (added within 30 days)
function isNewService(datetime) {
    if (!datetime) return false;
    const serviceDate = new Date(datetime);
    const now = new Date();
    return (now - serviceDate) / (1000 * 60 * 60 * 24) <= 30;
}

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    try {
        await fetchCategories();
        await fetchServices();
        renderCategoryFilters(state.categories);  // Render dynamic categories here
        renderServices();
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
        const servicesGrid = document.getElementById('servicesGrid');
        if (servicesGrid) {
            servicesGrid.innerHTML = '<p class="text-danger">Failed to load services. Please try again later.</p>';
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

async function fetchServices() {
    const cachedServices = sessionStorage.getItem(cacheKey);
    if (cachedServices) {
        const services = JSON.parse(cachedServices);
        state.services = services;
        state.filteredServices = [...services];
        return; // skip fetch, use cached
    }

    const response = await fetch(`${API_BASE}/services/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const rawServices = result.data || [];

    state.services = rawServices.map(service => {
        let imageUrl = 'assets/img/default-service-image.jpg';
        if (service.documents) {
            const docs = service.documents.split(',').map(s => s.trim());
            if (docs.length && docs[0] !== '') {
                imageUrl = `/shared-uploads/${docs[0]}`;
            }
        }

        const price = service.price || 0;
        const datetime = service.datetime;

        return {
            serviceid: service.serviceid,
            name: service.name || 'Unnamed Service',
            description: service.description || 'No description provided.',
            price: price,
            category: service.categoryid,
            item_type: 'service',
            image: imageUrl,
            featured: price >= 100,
            new: isNewService(datetime),
            best: price >= 50 && price < 100,
            special: price < 50
        };
    });

    state.filteredServices = [...state.services];
    sessionStorage.setItem('services', JSON.stringify(state.services));
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
        wrapper.className = 'afrobuild_service_page_filter-checkbox';
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
        if (!e.target.closest('.afrobuild_service_page_filter-dropdown') && !e.target.closest('#filterBtn')) {
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

    let filtered = state.services.filter(service => {
        return (
            matchesSearch(service, filters.searchTerm) &&
            matchesCategory(service, filters.selectedCategories) &&
            matchesPrice(service, filters.maxPrice, filters.budgetFriendly, filters.premium)
        );
    });
    // console.log('Filtered services count after main filters:', filtered.length);

    if (state.currentSort && ['featured', 'new', 'best', 'special'].includes(state.currentSort)) {
        filtered = filtered.filter(service => service[state.currentSort]);
        // console.log(`Filtered services count after filtering by sort= ${state.currentSort}:`, filtered.length);
    }

    sortServices(filtered, state.currentSort);
    state.filteredServices = filtered;
    state.currentPage = 0;
    renderServices();
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

function matchesSearch(service, searchTerm) {
    if (!searchTerm) return true; // No search term means always match

    const term = searchTerm.toLowerCase();

    // Prepare the fields to search
    const name = service.name ? service.name.toLowerCase() : "";
    const description = service.description ? service.description.toLowerCase() : "";
    const categoryName = categoryMap[service.category] || "";

    // Search in name, description, and mapped categoryName
    return (
        name.includes(term) ||
        description.includes(term) ||
        categoryName.includes(term)
    );
}

function matchesCategory(service, selectedCategories) {
    if (selectedCategories.length === 0) return true;
    // service.category might be a number, so compare as string
    return selectedCategories.includes(service.category.toString());
}

function matchesPrice(service, maxPrice, budgetFriendly, premium) {
    const price = service.price;

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

function sortServices(services, sortOption) {
    // Sort so true flags come before false ones (descending)
    const sorters = {
        featured: (a, b) => (a.featured ? 1 : 0) - (b.featured ? 1 : 0),
        new: (a, b) => (a.new ? 1 : 0) - (b.new ? 1 : 0),
        best: (a, b) => (a.best ? 1 : 0) - (b.best ? 1 : 0),
        special: (a, b) => (a.special ? 1 : 0) - (b.special ? 1 : 0)
    };

    if (sorters[sortOption]) {
        services.sort(sorters[sortOption]);
    }
}

function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    const startIdx = state.currentPage * state.itemsPerPage;
    const endIdx = startIdx + state.itemsPerPage;
    const current = state.filteredServices.slice(startIdx, endIdx);

    if (current.length > 0) {
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = 'none';
        grid.innerHTML = current.map(createServiceCard).join('');
    } else {
        grid.innerHTML = '';
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = 'block';
    }

    updatePagination();
    updateServiceCount();
}

function createServiceCard(service) {
    return `
        <div class="col-lg-4 col-md-6">
            <div class="card h-100 border-0 shadow-sm afrobuild_service_page_service-card" style="border-radius: 15px; overflow: hidden;">
                <img src="${service.image}" class="card-img-top" style="height: 250px; object-fit: cover;" alt="${service.name}">
                <div class="card-body bg-white p-4">
                    <h5 class="card-title fw-bold mb-2">${service.name}</h5>
                    <p class="card-text text-muted small mb-3">${service.description || "No description provided."}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold afrobuild-product-price-amount">GH₵${service.price.toFixed(2)}</span>
                        <div>
                            <input type="number" id="quantity_${service.serviceid}" class="form-control" value="1" min="1" style="width: 60px;">
                            <button class="afrobuild-btn afrobuild-btn-success mt-2" onclick="addToCart(${service.serviceid})">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function updatePagination() {
    const totalPages = Math.ceil(state.filteredServices.length / state.itemsPerPage);
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

function updateServiceCount() {
    const count = state.filteredServices.length;
    const total = state.services.length;
    const text = count === total ? "Showing all services" : `Showing ${count} of ${total} services`;
    const serviceCount = document.getElementById('serviceCount');
    const resultCount = document.getElementById('resultCount');
    if (serviceCount) serviceCount.textContent = text;
    if (resultCount) resultCount.textContent = text;
}

function goToPage(page) {
    state.currentPage = page;
    renderServices();
}

function goToPreviousPage() {
    if (state.currentPage > 0) {
        state.currentPage--;
        renderServices();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(state.filteredServices.length / state.itemsPerPage);
    if (state.currentPage < totalPages - 1) {
        state.currentPage++;
        renderServices();
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
        <div class="afrobuild_service_page_active-filter-tag">
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
    if (current.premium) filters.push({ type: 'price', value: '150+', label: 'Premium Services', id: 'premium' });
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

// Function to add service to the cart
function addToCart(serviceId) {
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

    const quantityInput = document.getElementById(`quantity_${serviceId}`);
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 0;
    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity greater than 0.');
        return;
    }

    const service = getServiceById(serviceId);
    if (!service) return;

    let userCart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};

    if (userCart[serviceId]) {
        userCart[serviceId].quantity += quantity;
        userCart[serviceId].totalPrice = userCart[serviceId].price * userCart[serviceId].quantity;
    } else {
        userCart[serviceId] = {
            serviceid: service.serviceid,
            name: service.name,
            category: service.category,
            item_type: 'service',
            price: service.price,
            quantity: quantity,
            totalPrice: service.price * quantity
        };
    }

    sessionStorage.setItem(`cart_${userId}`, JSON.stringify(userCart));
    updateCartCount(userId);

    Swal.fire({
        title: 'Added to Cart!',
        text: `${quantity} ${service.name} has been added to your cart.`,
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

// Function to get service details by ID
function getServiceById(serviceId) {
    const service = state.services.find(service => service.serviceid === serviceId);
    if (!service) {
        console.error(`Service with ID ${serviceId} not found.`);
        return { name: 'Unknown Service' }; // Return a default fallback service if not found
    }
    return service;
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
    Object.keys(userCart).forEach(serviceId => {
        const item = userCart[serviceId];
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
