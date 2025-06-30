const categoryMap = {
  1: 'construction',
  2: 'electrical',
  3: 'plumbing'
};

// App state
const state = {
    services: [],
    currentPage: 0,
    itemsPerPage: 6,
    filteredServices: [],
    currentSort: 'featured'
};

// Helper: Check if service is new (added within last 30 days)
function isNewService(datetime) {
    if (!datetime) return false;
    const serviceDate = new Date(datetime);
    const now = new Date();
    const diffDays = (now - serviceDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    fetchServices()
        .then(() => {
            renderServices();
            setupEventListeners();
            updateFilterCount();
        })
        .catch(err => {
            console.error('Failed to load services:', err);
            document.getElementById('servicesGrid').innerHTML = '<p class="text-danger">Failed to load services. Please try again later.</p>';
        });
});

async function fetchServices() {
    try {
        const response = await fetch('http://localhost:3000/services');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const rawServices = result.data || [];

        state.services = rawServices.map(service => {
            // Extract first image from documents or fallback
            let imageUrl = 'assets/img/default-service-image.jpg';
            if (service.documents) {
                const docs = service.documents.split(',').map(s => s.trim());
                if (docs.length && docs[0] !== '') {
                    imageUrl = `http://localhost:3000/uploads/${docs[0]}`;
                }
            }

            const price = service.price || 0;
            const datetime = service.datetime;

            return {
                id: service.serviceid,
                name: service.name || 'Unnamed Service',
                description: service.description || '',
                price: price,
                category: categoryMap[service.categoryid] || 'other',
                image: imageUrl,

                featured: price >= 100,
                new: isNewService(datetime),
                best: price >= 50 && price < 100,
                special: price < 50
            };
        });

        state.filteredServices = [...state.services];
    } catch (error) {
        throw error;
    }
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

    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndSort, 300);
    });

    const priceRange = document.getElementById('priceRange');
    priceRange.addEventListener('input', () => {
        document.getElementById('priceValue').textContent = priceRange.value;
        filterAndSort();
    });

    document.querySelectorAll('#filterDropdown input').forEach(input => {
        input.addEventListener('change', () => {
            updateFilterCount();
            filterAndSort();
        });
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
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

    document.getElementById('prevBtn').addEventListener('click', goToPreviousPage);
    document.getElementById('nextBtn').addEventListener('click', goToNextPage);
}

function filterAndSort() {
    const filters = getCurrentFilters();

    state.filteredServices = state.services.filter(service => {
        return (
            matchesSearch(service, filters.searchTerm) &&
            matchesCategory(service, filters.selectedCategories) &&
            matchesPriceRange(service, filters.maxPrice) &&
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
        maxPrice: parseInt(document.getElementById('priceRange').value),
        budgetFriendly: document.getElementById('budget').checked,
        premium: document.getElementById('premium').checked
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

function sortServices(services, sortOption) {
    const sortFunctions = {
        featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
        new: (a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0),
        best: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0),
        special: (a, b) => (b.special ? 1 : 0) - (a.special ? 1 : 0)
    };

    if (sortFunctions[sortOption]) {
        services.sort(sortFunctions[sortOption]);
    }
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
                        <span class="fw-bold text-success">GH₵${service.price.toFixed(2)}</span>
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

    currentFilters.selectedCategories.forEach(cat => {
        const checkbox = document.querySelector(`#filterDropdown input[value="${cat}"]`);
        filters.push({
            type: 'category',
            value: cat,
            label: checkbox.nextElementSibling.textContent.trim(),
            id: checkbox.id
        });
    });

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

    if (currentFilters.searchTerm) {
        filters.push({
            type: 'search',
            value: currentFilters.searchTerm,
            label: `Search: "${currentFilters.searchTerm}"`,
            id: 'searchInput'
        });
    }

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

function removeFilter(type, id) {
    if (type === 'search') {
        document.getElementById('searchInput').value = '';
    } else if (type === 'priceRange') {
        document.getElementById('priceRange').value = 200;
        document.getElementById('priceValue').textContent = '200';
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
