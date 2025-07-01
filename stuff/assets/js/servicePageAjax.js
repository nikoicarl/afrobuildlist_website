// Dynamic category map (categoryid -> name)
const categoryMap = {};
// Cart to store service ID and quantity
const cart = {};

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

        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            Object.assign(cart, JSON.parse(savedCart));
            updateCartCount();
        }

        
        updateFilterCount();
    } catch (err) {
        console.error('Failed to load data:', err);
        document.getElementById('servicesGrid').innerHTML = '<p class="text-danger">Failed to load services. Please try again later.</p>';
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


async function fetchServices() {
    const cachedServices = localStorage.getItem('services');
    if (cachedServices) {
        const services = JSON.parse(cachedServices);
        state.services = services;
        state.filteredServices = [...services];
        return; // skip fetch, use cached
    }

    const response = await fetch(`${API_BASE}/services`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const rawServices = result.data || [];

    state.services = rawServices.map(service => {
        let imageUrl = 'assets/img/default-service-image.jpg';
        if (service.documents) {
            const docs = service.documents.split(',').map(s => s.trim());
            if (docs.length && docs[0] !== '') {
                imageUrl = `http://localhost:3000/uploads/${docs[0]}`;
            }
        }

        const price = service.price || 0;
        const datetime = service.datetime;
        const categoryName = categoryMap[service.categoryid] || 'other';

        return {
            id: service.serviceid,
            name: service.name || 'Unnamed Service',
            description: service.description || '',
            price: price,
            category: categoryName,
            image: imageUrl,
            featured: price >= 100,
            new: isNewService(datetime),
            best: price >= 50 && price < 100,
            special: price < 50
        };
    });

    state.filteredServices = [...state.services];
    localStorage.setItem('services', JSON.stringify(state.services));
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
    document.getElementById('filterBtn').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('filterDropdown').classList.toggle('show');
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.afrobuild_service_page_filter-dropdown') && !e.target.closest('#filterBtn')) {
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

    state.filteredServices = state.services.filter(service => {
        return (
            matchesSearch(service, filters.searchTerm) &&
            matchesCategory(service, filters.selectedCategories) &&
            matchesPriceRange(service, filters.maxPrice, filters.budgetFriendly, filters.premium) &&
            matchesSpecialPrices(service, filters.budgetFriendly, filters.premium)
        );
    });

    sortServices(state.filteredServices, state.currentSort);
    state.currentPage = 0;
    renderServices();
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

function matchesSearch(service, searchTerm) {
    if (!searchTerm) return true;
    return (
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm)
    );
}

function matchesCategory(service, selectedCategories) {
    return selectedCategories.length === 0 || selectedCategories.includes(service.category);
}

function matchesPriceRange(service, maxPrice, budgetFriendly, premium) {
    if (budgetFriendly || premium) return true;
    return service.price <= maxPrice;
}

function matchesSpecialPrices(service, budgetFriendly, premium) {
    if (budgetFriendly && premium) return service.price <= 75 || service.price >= 150;
    if (budgetFriendly) return service.price <= 75;
    if (premium) return service.price >= 150;
    return true;
}

function sortServices(services, sortOption) {
    const sorters = {
        featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
        new: (a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0),
        best: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0),
        special: (a, b) => (b.special ? 1 : 0) - (a.special ? 1 : 0)
    };
    if (sorters[sortOption]) services.sort(sorters[sortOption]);
}

function renderServices() {
    const grid = document.getElementById('servicesGrid');
    const startIdx = state.currentPage * state.itemsPerPage;
    const endIdx = startIdx + state.itemsPerPage;
    const current = state.filteredServices.slice(startIdx, endIdx);

    if (current.length > 0) {
        document.getElementById('noResults').style.display = 'none';
        grid.innerHTML = current.map(createServiceCard).join('');
    } else {
        grid.innerHTML = '';
        document.getElementById('noResults').style.display = 'block';
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
                    <p class="card-text text-muted small mb-3">${service.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-success">GH₵${service.price.toFixed(2)}</span>
                        <div>
                            <input type="number" id="quantity_${service.id}" class="form-control" value="1" min="1" style="width: 60px;">
                            <button class="afrobuild-btn  afrobuild-btn-success mt-2" onclick="addToCart(${service.id})">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}


function updatePagination() {
    const totalPages = Math.ceil(state.filteredServices.length / state.itemsPerPage);
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


function updateServiceCount() {
    const count = state.filteredServices.length;
    const total = state.services.length;
    const text = count === total ? "Showing all services" : `Showing ${count} of ${total} services`;
    document.getElementById('serviceCount').textContent = text;
    document.getElementById('resultCount').textContent = text;
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


// Function to update cart count in the header
function updateCartCount() {
    const userId = localStorage.getItem('userID'); // Get the unique user ID from localStorage
    if (!userId) {
        console.error("User ID not found in localStorage.");
        return; // Handle missing userId (maybe prompt user to log in or handle as needed)
    }

    // Fetch the cart specific to the user
    const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};
    const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

    // Update the cart count in the header
    document.getElementById('cartCount').textContent = totalItems;
    document.getElementById('cartCount').style.display = totalItems > 0 ? 'inline-block' : 'none';
}



// Function to add service to the cart
function addToCart(serviceId) {
    const userId = localStorage.getItem('userID'); // Get the unique user ID from localStorage
    if (!userId) {
        console.error("User ID not found in localStorage.");
        return; // If there's no userId, exit (you can handle login or prompt here)
    }

    const quantity = parseInt(document.getElementById(`quantity_${serviceId}`).value, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    // Get the service data by ID
    const service = getServiceById(serviceId);
    if (!service) return;

    // Retrieve the user's cart from localStorage, or initialize it if it doesn't exist
    let cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};

    // If the service already exists in the cart, update its quantity
    if (cart[serviceId]) {
        cart[serviceId].quantity += quantity;
        cart[serviceId].totalPrice = cart[serviceId].price * cart[serviceId].quantity;
    } else {
        // Add the service to the cart
        cart[serviceId] = {
            name: service.name,
            price: service.price,
            quantity: quantity,
            totalPrice: service.price * quantity
        };
    }

    // Save the updated cart to localStorage using the userId
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));

    // Update the cart count in the header
    updateCartCount();

    // Notify the user that the item has been added to the cart
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
        if (result.isDismissed) {
            window.location.href = '/cart'; // Redirect to cart if "Go to Cart" is clicked
        }
    });
}



// Function to get service details by ID (you can enhance this)
function getServiceById(serviceId) {
    const service = state.services.find(service => service.id === serviceId);
    if (!service) {
        console.error(`Service with ID ${serviceId} not found.`);
        return { name: 'Unknown Service' }; // Return a default fallback service if not found
    }
    return service;
}

// Function to update cart UI based on localStorage data
function updateCartUI() {
    const userId = localStorage.getItem('userID'); // Get the unique user ID from localStorage
    if (!userId) {
        console.error("User ID not found in localStorage.");
        return; // Handle missing userId as needed
    }

    // Retrieve the user's cart from localStorage
    const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};
    const cartItemsContainer = document.getElementById('cartItems');

    // Clear existing cart items
    cartItemsContainer.innerHTML = '';

    // Populate cart items
    Object.keys(cart).forEach(serviceId => {
        const item = cart[serviceId];
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
    const totalPrice = Object.values(cart).reduce((sum, item) => sum + item.totalPrice, 0);
    document.getElementById('totalPrice').textContent = `₵${totalPrice.toFixed(2)}`;
}

