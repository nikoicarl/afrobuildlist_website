document.addEventListener("DOMContentLoaded", function () {
    const servicesContainer = document.getElementById("servicesContainer");
    const paginationContainer = document.createElement("div");
    paginationContainer.id = "paginationControls";
    paginationContainer.className = "text-center mt-4";
    servicesContainer.after(paginationContainer);

    const cacheKey = "cachedServices";
    const state = {
        services: [],
        page: 1,
        perPage: 8,
    };
    const userId = sessionStorage.getItem("userID");

    // Create service card
    function createCardElement(service) {
        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents.split(",").map(s => s.trim()).filter(Boolean);
        }
        const imageUrl = docsArray.length
            ? `/images/${docsArray[0]}`
            : "assets/img/default-service-image.jpg"; // fallback if no docs

        const card = document.createElement("div");
        card.className = "afrobuild-product-card h-100";
        card.innerHTML = `
        <div class="afrobuild-product-card-image">
            <img 
                src="${imageUrl}" 
                alt="${service?.name?.replace(/"/g, "&quot;") || "Service image"}" 
                onerror="this.onerror=null;this.src='assets/img/default-service-image.jpg';" />
        </div>
        <div class="afrobuild-product-card-body">
            <h4 class="afrobuild-product-card-title">${service?.name || "Service Name"}</h4>
            <p class="afrobuild-product-card-description">${service?.description || "No description provided."}</p>
            <div class="afrobuild-product-card-footer">
                <div class="afrobuild-product-card-price">
                    <span class="afrobuild-product-price-label">From</span>
                    <span class="afrobuild-product-price-amount">
                        GH₵${typeof service?.price === "number" ? service.price.toFixed(2) : "0.00"}
                    </span>
                </div>
                <div class="afrobuild-product-card-actions">
                    <div>
                        <button class="afrobuild-btn afrobuild-btn-success mt-2 service-add-to-cart-btn" data-serviceid="${service.serviceid}">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
        return card;
    }


    // Render paginated services: 8 per page, displayed as 4 + 4
    function renderServices() {
        const startIndex = (state.page - 1) * state.perPage;
        const endIndex = startIndex + state.perPage;
        const paginatedServices = state.services.slice(startIndex, endIndex);

        servicesContainer.innerHTML = "";

        if (!Array.isArray(paginatedServices) || paginatedServices.length === 0) {
            servicesContainer.innerHTML = `<div class="col-12 text-center"><p>No services available.</p></div>`;
            return;
        }

        const firstRowServices = paginatedServices.slice(0, 4);
        const secondRowServices = paginatedServices.slice(4, 8);

        const row1 = document.createElement("div");
        row1.className = "row mb-4";

        firstRowServices.forEach(service => {
            const col = document.createElement("div");
            col.className = "col-lg-3 col-md-6 col-12 mb-4 d-flex";
            col.appendChild(createCardElement(service));
            row1.appendChild(col);
        });

        const row2 = document.createElement("div");
        row2.className = "row";

        secondRowServices.forEach(service => {
            const col = document.createElement("div");
            col.className = "col-lg-3 col-md-6 col-12 mb-4 d-flex";
            col.appendChild(createCardElement(service));
            row2.appendChild(col);
        });

        servicesContainer.appendChild(row1);
        servicesContainer.appendChild(row2);

        // Add to cart event listeners
        servicesContainer.querySelectorAll(".service-add-to-cart-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const serviceId = Number(this.dataset.serviceid);
                if (!serviceId) return;
                showServiceDetails(serviceId);
            });
        });

        renderPagination();
    }

    // Render Prev / Next controls
    function renderPagination() {
        const totalPages = Math.ceil(state.services.length / state.perPage);
        const prevDisabled = state.page === 1;
        const nextDisabled = state.page >= totalPages;

        paginationContainer.innerHTML = `
            <button id="prevPageBtn" class="afrobuild-btn afrobuild-btn-success mx-1" ${prevDisabled ? 'disabled' : ''}>
                ← Previous
            </button>
            <span class="mx-2 afrobuild-primary">Page ${state.page} of ${totalPages}</span>
            <button id="nextPageBtn" class="afrobuild-btn afrobuild-btn-success mx-1" ${nextDisabled ? 'disabled' : ''}>
                Next →
            </button>
        `;


        document.getElementById("prevPageBtn").addEventListener("click", () => {
            if (state.page > 1) {
                state.page--;
                renderServices();
            }
        });

        document.getElementById("nextPageBtn").addEventListener("click", () => {
            if (state.page < totalPages) {
                state.page++;
                renderServices();
            }
        });
    }

    // Fetch from API or session cache
    function fetchAndCacheServices() {
        fetch(`${API_BASE}/services/`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const services = Array.isArray(data) ? data : data.data;
                if (!Array.isArray(services)) throw new Error("Invalid service data format");

                sessionStorage.setItem(cacheKey, JSON.stringify(services));
                state.services = services;
                state.page = 1;
                renderServices();
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                servicesContainer.innerHTML = `<div class="col-12 text-center"><p>Failed to load services.</p></div>`;
            });
    }

    // Require login before cart actions
    function requireLogin() {
        if (userId) return true;

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Please log in",
                text: "You need to log in to add items to your cart.",
                icon: "warning",
                confirmButtonText: "Login",
                cancelButtonText: "Cancel",
                showCancelButton: true,
                customClass: { confirmButton: "afrobuild-btn-success" },
                buttonsStyling: true,
            }).then(result => {
                if (result.isConfirmed) {
                    window.location.href = "/login";
                }
            });
        } else {
            alert("Please log in to add items to your cart.");
        }

        return false;
    }

    function showServiceDetails(serviceId) {
        const service = getServiceById(serviceId);
        if (!service || typeof Swal === "undefined") return;

        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents.split(",").map(s => s.trim()).filter(Boolean);
        }

        const imageUrl = docsArray.length
            ? `/images/${docsArray[0]}`
            : "assets/img/default-service-image.jpg";

        const price = typeof service.price === "number" ? service.price.toFixed(2) : "0.00";
        const description = service.description || "No description available.";
        const supplier = service.supplier?.toUcwords?.() || "Unknown Supplier";

        Swal.fire({
            title: service.name || "Service Details",
            html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 680px; margin: auto; text-align: left;">
                <div style="margin-bottom: 16px;">
                    <img 
                        src="${imageUrl}" 
                        alt="${service.name || "Service"}"
                        style="width: 100%; height: auto; max-height: 240px; object-fit: contain; border-radius: 6px; border: 1px solid #ddd;"
                        onerror="this.onerror=null;this.src='assets/img/default-service-image.jpg';"
                    />
                </div>

                <div style="margin-bottom: 14px;">
                    <h3 style="font-size: 16px; margin-bottom: 6px;">Description</h3>
                    <p style="font-size: 14px; color: #333; line-height: 1.5;">
                        ${description}
                    </p>
                </div>

                <div style="margin-bottom: 14px;">
                    <h4 style="font-size: 15px; margin-bottom: 4px;">Supplier</h4>
                    <p style="font-size: 14px; margin: 0; color: #555;">${supplier}</p>
                </div>

                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 15px; margin-bottom: 4px;">Price</h4>
                        <p style="font-size: 14px; color: #222;">GH₵ ${price}</p>
                    </div>
                    <div>
                        <label for="modalQuantityInput" style="font-size: 14px; font-weight: 500; display: block; margin-bottom: 6px;">
                            Quantity
                        </label>
                        <input 
                            id="modalQuantityInput" 
                            type="number" 
                            min="1" 
                            value="1"
                            style="width: 80px; padding: 6px 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;"
                        />
                    </div>
                </div>
            </div>
        `,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: "Add to Cart",
            cancelButtonText: "Close",
            customClass: {
                popup: "swal2-afrobuild",
                confirmButton: "afrobuild-btn-success",
                cancelButton: "afrobuild-btn-secondary"
            },
            preConfirm: () => {
                const qtyInput = document.getElementById("modalQuantityInput");
                const qty = parseInt(qtyInput?.value, 10);
                if (!qtyInput || isNaN(qty) || qty <= 0) {
                    Swal.showValidationMessage("Please enter a valid quantity.");
                    return false;
                }
                addToCart(serviceId, qty);
            }
        });
    }


    function addToCart(serviceId, quantity = 1) {
        if (!requireLogin()) return;

        const service = getServiceById(serviceId);
        if (!service) return;

        let cart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};

        if (cart[serviceId]) {
            cart[serviceId].quantity += quantity;
            cart[serviceId].totalPrice = cart[serviceId].price * cart[serviceId].quantity;
        } else {
            cart[serviceId] = {
                serviceid: service.serviceid,
                name: service.name,
                category: service.categoryid,
                item_type: "service",
                price: service.price,
                quantity,
                totalPrice: service.price * quantity,
            };
        }

        sessionStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
        updateCartCount();

        Swal.fire({
            title: "Added to Cart!",
            text: `${quantity} ${service.name} added to your cart.`,
            icon: "success",
            confirmButtonText: "Continue",
            customClass: { confirmButton: "afrobuild-btn-success" }
        });
    }


    function getServiceById(serviceId) {
        return state.services.find(s => s.serviceid === serviceId) || null;
    }

    function updateCartCount() {
        if (!userId) return;

        const cart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};
        const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElem = document.getElementById("cartCount");

        if (cartCountElem) {
            cartCountElem.textContent = count;
            cartCountElem.style.display = count > 0 ? "inline-block" : "none";

            cartCountElem.classList.remove("cart-bounce");
            void cartCountElem.offsetWidth;
            cartCountElem.classList.add("cart-bounce");
        }
    }

    // Attach search filter
    function setupSearch() {
        const searchInput = document.getElementById("serviceSearchInput");

        if (!searchInput) return;

        searchInput.addEventListener("input", function () {
            const query = this.value.trim().toLowerCase();
            const services = JSON.parse(sessionStorage.getItem(cacheKey)) || [];

            if (query === "") {
                state.services = services;
            } else {
                state.services = services.filter(service =>
                    (service.name && service.name.toLowerCase().includes(query)) ||
                    (service.description && service.description.toLowerCase().includes(query))
                );
            }

            state.page = 1;
            renderServices();
        });
    }


    (function init() {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const services = JSON.parse(cached);
                if (Array.isArray(services)) {
                    state.services = services;
                    state.page = 1;
                    renderServices();
                    setupSearch(); // ← Add this line
                    return;
                }
                throw new Error("Invalid cached data");
            } catch {
                sessionStorage.removeItem(cacheKey);
            }
        }

        fetchAndCacheServices();
        setupSearch(); // ← Also call it here just in case input came before fetch
    })();

});
