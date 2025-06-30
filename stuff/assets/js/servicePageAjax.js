// Service data
const services = [
    {
        id: 1,
        name: "Cement Supply",
        category: "construction",
        description: "High-quality cement for all your construction needs. Perfect for foundations, walls, and structural work.",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 5,
        reviews: 1000,
        price: 100,
        featured: true,
        new: false,
        best: true,
        special: false
    },
    {
        id: 2,
        name: "Steel Rods",
        category: "construction",
        description: "Premium steel reinforcement bars for concrete structures. Various sizes available for different construction needs.",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 4,
        reviews: 750,
        price: 150,
        featured: true,
        new: true,
        best: false,
        special: true
    },
    {
        id: 3,
        name: "Concrete Blocks",
        category: "construction",
        description: "Durable concrete blocks for building walls and structures. Available in various sizes and specifications.",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 4,
        reviews: 500,
        price: 75,
        featured: false,
        new: false,
        best: true,
        special: false
    },
    {
        id: 4,
        name: "Brick Supply",
        category: "construction",
        description: "Quality bricks for construction and landscaping projects. Fire-resistant and weather-proof options available.",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 4,
        reviews: 800,
        price: 45,
        featured: false,
        new: true,
        best: false,
        special: true
    },
    {
        id: 5,
        name: "Electrical Installation",
        category: "electrical",
        description: "Professional electrical installation services for homes and businesses. Licensed electricians with years of experience.",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 5,
        reviews: 1200,
        price: 120,
        featured: true,
        new: false,
        best: true,
        special: false
    },
    {
        id: 6,
        name: "Plumbing Services",
        category: "plumbing",
        description: "Complete plumbing solutions including repairs, installations, and maintenance. 24/7 emergency service available.",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 4,
        reviews: 950,
        price: 85,
        featured: false,
        new: false,
        best: true,
        special: true
    },
    {
        id: 7,
        name: "Wiring & Repairs",
        category: "electrical",
        description: "Expert electrical wiring and repair services. Safe and code-compliant installations for residential and commercial properties.",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 5,
        reviews: 600,
        price: 95,
        featured: false,
        new: true,
        best: false,
        special: false
    },
    {
        id: 8,
        name: "Pipe Installation",
        category: "plumbing",
        description: "Professional pipe installation and replacement services. Using high-quality materials for long-lasting results.",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 4,
        reviews: 400,
        price: 110,
        featured: false,
        new: false,
        best: false,
        special: true
    },
    {
        id: 9,
        name: "Solar Panel Installation",
        category: "electrical",
        description: "Green energy solutions with professional solar panel installation. Reduce your electricity bills with renewable energy.",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        rating: 5,
        reviews: 300,
        price: 180,
        featured: true,
        new: true,
        best: true,
        special: true
    }
];

// App state
const state = {
    currentPage: 0,
    itemsPerPage: 6,
    filteredServices: [...services],
    currentSort: 'featured'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    renderServices();
    setupEventListeners();
    updateFilterCount();
});

function setupEventListeners() {
    // Filter button toggle
    document.getElementById('filterBtn').addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('filterDropdown').classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.afrobuild_service_page_filter-dropdown') && !e.target.closest('#filterBtn')) {
            document.getElementById('filterDropdown').classList.remove('show');
        }
    });

    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndSort, 300);
    });

    // Price range slider
    const priceRange = document.getElementById('priceRange');
    priceRange.addEventListener('input', () => {
        document.getElementById('priceValue').textContent = priceRange.value;
        filterAndSort();
    });

    // All filter checkboxes and radio buttons
    document.querySelectorAll('#filterDropdown input').forEach(input => {
        input.addEventListener('change', () => {
            updateFilterCount();
            filterAndSort();
        });
    });

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Update active button
            document.querySelectorAll('.sort-btn').forEach(b => {
                b.classList.remove('btn-success');
                b.classList.add('btn-outline-secondary');
            });
            this.classList.remove('btn-outline-secondary');
            this.classList.add('btn-success');

            state.currentSort = this.dataset.sort;
            filterAndSort();
        });
    });

    // Pagination buttons
    document.getElementById('prevBtn').addEventListener('click', goToPreviousPage);
    document.getElementById('nextBtn').addEventListener('click', goToNextPage);
}

function filterAndSort() {
    const filters = getCurrentFilters();

    // Filter services
    state.filteredServices = services.filter(service => {
        return (
            matchesSearch(service, filters.searchTerm) &&
            matchesCategory(service, filters.selectedCategories) &&
            matchesPriceRange(service, filters.maxPrice) &&
            matchesSpecialPrices(service, filters.budgetFriendly, filters.premium) &&
            matchesRating(service, filters.minRating) &&
            matchesPopular(service, filters.popularOnly)
        );
    });

    // Sort services
    sortServices(state.filteredServices, state.currentSort);

    state.currentPage = 0;
    renderServices();
    updateActiveFiltersDisplay();
}

function getCurrentFilters() {
    return {
        searchTerm: document.getElementById('searchInput').value.toLowerCase(),
        selectedCategories: getSelectedCategories(),
        maxPrice: parseInt(document.getElementById('priceRange').value),
        budgetFriendly: document.getElementById('budget').checked,
        premium: document.getElementById('premium').checked,
        minRating: document.querySelector('#filterDropdown input[name="rating"]:checked')?.value,
        popularOnly: document.getElementById('popularFilter').checked
    };
}

function getSelectedCategories() {
    const selected = [];
    document.querySelectorAll('#filterDropdown input[type="checkbox"]:checked').forEach(cb => {
        if (['construction', 'electrical', 'plumbing'].includes(cb.value)) {
            selected.push(cb.value);
        }
    });
    return selected;
}

// Filter helper functions
function matchesSearch(service, searchTerm) {
    return searchTerm === '' ||
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm);
}

function matchesCategory(service, selectedCategories) {
    return selectedCategories.length === 0 || selectedCategories.includes(service.category);
}

function matchesPriceRange(service, maxPrice) {
    return service.price <= maxPrice;
}

function matchesSpecialPrices(service, budgetFriendly, premium) {
    if (budgetFriendly && premium) {
        return service.price <= 75 || service.price >= 150;
    }
    if (budgetFriendly) return service.price <= 75;
    if (premium) return service.price >= 150;
    return true;
}

function matchesRating(service, minRating) {
    return !minRating || service.rating >= parseInt(minRating);
}

function matchesPopular(service, popularOnly) {
    return !popularOnly || service.reviews >= 500;
}

function sortServices(services, sortOption) {
    const sortFunctions = {
        featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
        new: (a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0),
        best: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0),
        special: (a, b) => (b.special ? 1 : 0) - (a.special ? 1 : 0)
    };

    services.sort(sortFunctions[sortOption] || (() => 0));
}

function renderServices() {
    const grid = document.getElementById('servicesGrid');
    const startIdx = state.currentPage * state.itemsPerPage;
    const endIdx = startIdx + state.itemsPerPage;
    const currentServices = state.filteredServices.slice(startIdx, endIdx);

    grid.innerHTML = currentServices.length > 0
        ? currentServices.map(createServiceCard).join('')
        : showNoResults();

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
                                <span class="text-warning small">${'★'.repeat(service.rating)}${'☆'.repeat(5 - service.rating)} • ${service.reviews}k</span>
                                <span class="fw-bold text-success">GH₵${service.price}.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

function showNoResults() {
    document.getElementById('noResults').style.display = 'block';
    return '';
}

function updatePagination() {
    const totalPages = Math.ceil(state.filteredServices.length / state.itemsPerPage);
    const dotsContainer = document.getElementById('paginationDots');

    dotsContainer.innerHTML = totalPages <= 1 ? '' :
        Array.from({ length: totalPages }, (_, i) => `
                    <span class="rounded-circle d-inline-block me-2 ${i === state.currentPage ? 'bg-success' : 'bg-secondary'}" 
                     style="width: 12px; height: 12px; opacity: ${i === state.currentPage ? '1' : '0.3'}; cursor: pointer;"
                     onclick="goToPage(${i})"></span>`
        ).join('');
}

function updateServiceCount() {
    const count = state.filteredServices.length;
    const total = services.length;
    const text = count === total ? "Showing all services" : `Showing ${count} of ${total} services`;
    document.getElementById('serviceCount').textContent = text;
    document.getElementById('resultCount').textContent = text;
}

// Navigation functions
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

// Filter management
function updateFilterCount() {
    const activeCount = document.querySelectorAll('#filterDropdown input:checked').length;
    const badge = document.getElementById('filterCount');

    badge.textContent = activeCount;
    badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    updateActiveFiltersDisplay();
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    const filters = getActiveFilters();

    container.innerHTML = filters.map(filter => `
                <div class="afrobuild_service_page_active-filter-tag">
                    <span>${filter.label}</span>
                    <button class="remove" onclick="removeFilter('${filter.type}', '${filter.id}')">×</button>
                </div>`
    ).join('');
}

function getActiveFilters() {
    const filters = [];
    const currentFilters = getCurrentFilters();

    // Category filters
    currentFilters.selectedCategories.forEach(cat => {
        const checkbox = document.querySelector(`#filterDropdown input[value="${cat}"]`);
        filters.push({
            type: 'category',
            value: cat,
            label: checkbox.nextElementSibling.textContent.trim(),
            id: checkbox.id
        });
    });

    // Price filters
    if (currentFilters.budgetFriendly) {
        filters.push({
            type: 'price',
            value: '0-75',
            label: 'Budget Friendly',
            id: 'budget'
        });
    }
    if (currentFilters.premium) {
        filters.push({
            type: 'price',
            value: '150-999',
            label: 'Premium Services',
            id: 'premium'
        });
    }

    // Rating filter
    if (currentFilters.minRating) {
        const radio = document.querySelector(`#filterDropdown input[value="${currentFilters.minRating}"]`);
        filters.push({
            type: 'rating',
            value: currentFilters.minRating,
            label: `${currentFilters.minRating}+ Stars`,
            id: radio.id
        });
    }

    // Popular filter
    if (currentFilters.popularOnly) {
        filters.push({
            type: 'popular',
            value: 'popular',
            label: 'Popular',
            id: 'popularFilter'
        });
    }

    // Search term
    if (currentFilters.searchTerm) {
        filters.push({
            type: 'search',
            value: currentFilters.searchTerm,
            label: `Search: "${currentFilters.searchTerm}"`,
            id: 'searchInput'
        });
    }

    // Price range
    if (currentFilters.maxPrice < 200) {
        filters.push({
            type: 'priceRange',
            value: currentFilters.maxPrice,
            label: `Up to GH₵${currentFilters.maxPrice}`,
            id: 'priceRange'
        });
    }

    return filters;
}

// Filter actions
function removeFilter(type, id) {
    if (type === 'search') {
        document.getElementById('searchInput').value = '';
    } else if (type === 'priceRange') {
        document.getElementById('priceRange').value = 200;
        document.getElementById('priceValue').textContent = '200';
    } else if (type === 'rating') {
        document.querySelector(`#${id}`).checked = false;
    } else {
        document.getElementById(id).checked = false;
    }

    updateFilterCount();
    filterAndSort();
}

function applyFilters() {
    filterAndSort();
    document.getElementById('filterDropdown').classList.remove('show');
}

function clearFilters() {
    document.querySelectorAll('#filterDropdown input').forEach(input => input.checked = false);
    document.getElementById('searchInput').value = '';
    document.getElementById('priceRange').value = 200;
    document.getElementById('priceValue').textContent = '200';

    updateFilterCount();
    filterAndSort();
    document.getElementById('filterDropdown').classList.remove('show');
}