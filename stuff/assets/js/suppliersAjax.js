const cacheKey = 'cachedSuppliers';
const suppliersContainer = document.getElementById('supplierCardsContainer');
const defaultImage = "/assets/img/default-service-image.jpg";
const paginationControls = document.createElement('div');
paginationControls.id = "paginationControls";
paginationControls.className = "d-flex justify-content-center mt-4";
suppliersContainer.after(paginationControls);

let allSuppliers = [];
const pagination = {
    currentPage: 1,
    perPage: 6
};


// --- Utility function ---
function toUcwords(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

// --- Fetch suppliers and cache ---
function fetchAndCacheSuppliers() {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            allSuppliers = JSON.parse(cached);
            renderSuppliers(allSuppliers);
            return;
        } catch {
            sessionStorage.removeItem(cacheKey);
        }
    }

    fetch(`${API_BASE}/suppliers/`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            const suppliers = Array.isArray(data) ? data : data.data;
            if (!Array.isArray(suppliers)) throw new Error("Invalid suppliers data format");

            // Assign proper image paths
            suppliers.forEach(supplier => {
                // Update product images
                if (Array.isArray(supplier.products)) {
                    supplier.products.forEach(product => {
                        if (!product.image || product.image === '') {
                            product.image = defaultImage;
                        } else {
                            product.image = `/shared-uploads/${product.image}`;
                        }
                    });
                }

                // Update service images
                if (Array.isArray(supplier.services)) {
                    supplier.services.forEach(service => {
                        if (!service.image || service.image === '') {
                            service.image = defaultImage;
                        } else {
                            service.image = `/shared-uploads/${service.image}`;
                        }
                    });
                }
            });

            allSuppliers = suppliers.filter(supplier =>
                (supplier.products && supplier.products.length > 0) ||
                (supplier.services && supplier.services.length > 0)
            );

            sessionStorage.setItem(cacheKey, JSON.stringify(allSuppliers));
            renderSuppliers(allSuppliers);
        })
        .catch(err => {
            console.error("Error fetching suppliers:", err);
            suppliersContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>Failed to load suppliers.</p>
                </div>`;
        });
}

// --- Render suppliers with products and services ---
function renderSuppliers(suppliers) {
    suppliersContainer.innerHTML = '';
    paginationControls.innerHTML = '';

    if (!suppliers.length) {
        suppliersContainer.innerHTML = `<div class="col-12 text-center"><p>No suppliers found.</p></div>`;
        return;
    }

    const totalPages = Math.ceil(suppliers.length / pagination.perPage);
    const start = (pagination.currentPage - 1) * pagination.perPage;
    const end = start + pagination.perPage;
    const suppliersToShow = suppliers.slice(start, end);

    suppliersToShow.forEach((supplier, indexOffset) => {
        const index = start + indexOffset;

        const productsContent = supplier.products.length
            ? supplier.products.map(product => {
                const desc = trimDescription(product.description);
                return `
                <div class="item-container mb-3 d-flex align-items-center gap-3">
                    <img src="${product.image}" alt="${product.name}" class="item-image" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;" />
                    <div class="item-info flex-grow-1">
                        <h6 class="mb-1">${product.name}</h6>
                        <p class="mb-1 text-muted" style="font-size: 14px;">${desc}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="price-text fw-bold">GH₵${product.price.toFixed(2)}</span>
                            <div class="d-flex align-items-center gap-2">
                                <input type="number" id="quantity_${product.productid}" min="1" value="1" class="form-control form-control-sm" style="width: 60px;" />
                                <button class="btn btn-sm btn-success" onclick="addToCart(${product.productid})">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('')
            : '<p>No products available.</p>';

        const servicesContent = supplier.services.length
            ? supplier.services.map(service => {
                const desc = trimDescription(service.description);
                return `
                <div class="item-container mb-3 d-flex align-items-center gap-3">
                    <img src="${service.image}" alt="${service.name}" class="item-image" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;" />
                    <div class="item-info flex-grow-1">
                        <h6 class="mb-1">${service.name}</h6>
                        <p class="mb-1 text-muted" style="font-size: 14px;">${desc}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="price-text fw-bold">GH₵${service.price.toFixed(2)}</span>
                            <div class="d-flex align-items-center gap-2">
                                <input type="number" id="quantity_${service.serviceid}" min="1" value="1" class="form-control form-control-sm" style="width: 60px;" />
                                <button class="btn btn-sm btn-success" onclick="addToCart(${service.serviceid})">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('')
            : '<p>No services available.</p>';

        const cardHTML = `
            <div class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="card border-0 h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-center mb-4 mt-4">${toUcwords(supplier.name)}</h5>
                        <ul class="nav nav-pills nav-fill mb-3 mt-4" id="pills-tab-${index}" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link active" id="pills-products-tab-${index}" data-toggle="pill" href="#pills-products-${index}" role="tab">Products</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="pills-services-tab-${index}" data-toggle="pill" href="#pills-services-${index}" role="tab">Services</a>
                            </li>
                        </ul>
                        <div class="tab-content" id="pills-tabContent-${index}" style="flex-grow:1; overflow-y:auto; max-height: 350px;">
                            <div class="tab-pane fade show active" id="pills-products-${index}" role="tabpanel">
                                ${productsContent}
                            </div>
                            <div class="tab-pane fade" id="pills-services-${index}" role="tabpanel">
                                ${servicesContent}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        suppliersContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    if (totalPages <= 1) return;

    let buttonsHTML = `
        <nav>
            <ul class="pagination">`;

    buttonsHTML += `
        <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Previous</a>
        </li>`;

    for (let i = 1; i <= totalPages; i++) {
        buttonsHTML += `
        <li class="page-item ${pagination.currentPage === i ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    buttonsHTML += `
        <li class="page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Next</a>
        </li>
        </ul>
        </nav>`;

    paginationControls.innerHTML = buttonsHTML;

    paginationControls.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                pagination.currentPage = page;
                renderSuppliers(allSuppliers);
            }
        });
    });
}

// --- Search filter suppliers by product/service name or description ---
function filterSuppliers(searchTerm) {
    if (!searchTerm) {
        renderSuppliers(allSuppliers);
        return;
    }

    const lowerTerm = searchTerm.toLowerCase();

    const filtered = allSuppliers.map(supplier => {
        const matchedProducts = supplier.products.filter(p =>
            p.name.toLowerCase().includes(lowerTerm) ||
            (p.description && p.description.toLowerCase().includes(lowerTerm))
        );

        const matchedServices = supplier.services.filter(s =>
            s.name.toLowerCase().includes(lowerTerm) ||
            (s.description && s.description.toLowerCase().includes(lowerTerm))
        );

        if (matchedProducts.length > 0 || matchedServices.length > 0) {
            return {
                ...supplier,
                products: matchedProducts,
                services: matchedServices
            };
        }

        return null;
    }).filter(Boolean);

    renderSuppliers(filtered.filter(supplier =>
        (supplier.products && supplier.products.length > 0) ||
        (supplier.services && supplier.services.length > 0)
    ));

}


// --- Add search input above suppliers container ---
function addSearchInput() {
    const containerParent = suppliersContainer.parentElement;

    const searchWrapper = document.createElement('div');
    searchWrapper.className = "d-flex flex-wrap justify-content-center align-items-center gap-3 mb-5";

    searchWrapper.innerHTML = `
        <div class="d-flex align-items-center bg-white rounded-pill border px-3"
            style="min-width: 310px; max-width: 330px !important; height: 48px;">
            <input type="text" id="serviceSearchInput" class="form-control border-0 bg-transparent px-2"
                placeholder="Search" style="box-shadow: none;">
            <button id="searchButton" class="btn rounded-circle d-flex align-items-center justify-content-center"
                style="background: var(--primary-color); width: 36px; height: 36px;">
                <svg width="18" height="18" fill="white" viewBox="0 0 16 16">
                    <path
                        d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.398a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
                </svg>
            </button>
        </div>
    `;

    containerParent.insertBefore(searchWrapper, suppliersContainer);

    const searchInput = document.getElementById('serviceSearchInput');
    const searchButton = document.getElementById('searchButton');

    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        filterSuppliers(value);
    });

    searchButton.addEventListener('click', () => {
        const value = searchInput.value.trim();
        filterSuppliers(value);
    });
}


// --------------------
// CART & USER MANAGEMENT
// --------------------

// Function to update cart count in the header
function updateCartCount() {
    const userId = sessionStorage.getItem('userID');
    if (!userId) {
        document.getElementById('cartCount').textContent = '';
        document.getElementById('cartCount').style.display = 'none';
        return;
    }

    const cart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};
    const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById('cartCount').textContent = totalItems;
    document.getElementById('cartCount').style.display = totalItems > 0 ? 'inline-block' : 'none';
}

// Add product or service to cart
function addToCart(Id) {
    const userId = sessionStorage.getItem('userID');
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

    const quantityInput = document.getElementById(`quantity_${Id}`);
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
    if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity (1 or more).");
        return;
    }

    let item = null;
    let itemType = '';
    let itemIdKey = '';

    for (const supplier of allSuppliers) {
        item = supplier.products.find(p => p.productid === Id);
        if (item) {
            itemType = 'product';
            itemIdKey = 'productid';
            break;
        }
        item = supplier.services.find(s => s.serviceid === Id);
        if (item) {
            itemType = 'service';
            itemIdKey = 'serviceid';
            break;
        }
    }

    if (!item) {
        alert("Product or service not found.");
        return;
    }

    const itemId = item[itemIdKey];
    const cartKey = `cart_${userId}`;
    let cart = JSON.parse(sessionStorage.getItem(cartKey)) || {};

    if (cart[itemId]) {
        cart[itemId].quantity += quantity;
        cart[itemId].totalPrice = cart[itemId].price * cart[itemId].quantity;
    } else {
        cart[itemId] = {
            [itemIdKey]: itemId,
            name: item.name,
            category: item.category || '',
            item_type: itemType,
            price: item.price,
            quantity: quantity,
            totalPrice: item.price * quantity
        };
    }

    sessionStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartCount();

    Swal.fire({
        title: 'Added to Cart!',
        text: `${quantity} x ${item.name} has been added to your cart.`,
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
            window.location.href = '/cart';
        }
    });
}



// On DOM ready, initialize
document.addEventListener('DOMContentLoaded', () => {
    addSearchInput();
    fetchAndCacheSuppliers();
    updateCartCount();
});
