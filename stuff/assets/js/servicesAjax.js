document.addEventListener("DOMContentLoaded", function () {
    const servicesContainer = document.getElementById("servicesContainer");
    const cacheKey = "cachedServices";
    const state = { services: [] };
    const userId = sessionStorage.getItem("userID");

    if (!servicesContainer) {
        console.error("No element with ID 'servicesContainer' found.");
        return;
    }

    // Helper: Create service card element
    function createCardElement(service) {
        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);
        }
        const imageUrl = docsArray.length
            ? `/images/services/${docsArray[0]}`
            : "assets/img/default-service-image.jpg";

        const card = document.createElement("div");
        card.className = "afrobuild-product-card h-100";

        card.innerHTML = `
      <div class="afrobuild-product-card-image">
        <img src="${imageUrl}" alt="${service?.name ? service.name.replace(/"/g, "&quot;") : "Service image"}" />
      </div>
      <div class="afrobuild-product-card-body">
        <h4 class="afrobuild-product-card-title">${service?.name || "Service Name"}</h4>
        <p class="afrobuild-product-card-description">${service?.description || "No description provided."}</p>
        <div class="afrobuild-product-card-footer">
          <div class="afrobuild-product-card-price">
            <span class="afrobuild-product-price-label">From</span>
            <span class="afrobuild-product-price-amount">GH₵${typeof service?.price === "number" ? service.price.toFixed(2) : "0.00"}</span>
          </div>
          <div class="afrobuild-product-card-actions">
            <div>
              <input type="number" id="quantity_${service.serviceid}" class="form-control" value="1" min="1" style="width: 60px;" />
              <button class="afrobuild-btn afrobuild-btn-success mt-2 service-add-to-cart-btn" data-serviceid="${service.serviceid}">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    `;

        return card;
    }

    // Render services grid
    function renderServices(services) {
        servicesContainer.innerHTML = "";
        if (!Array.isArray(services) || services.length === 0) {
            servicesContainer.innerHTML = `<div class="col-12 text-center"><p>No services available.</p></div>`;
            return;
        }

        const row = document.createElement("div");
        row.className = "row";

        services.forEach(service => {
            const col = document.createElement("div");
            col.className = "col-lg-3 col-md-6 col-12 mb-4 d-flex";
            col.appendChild(createCardElement(service));
            row.appendChild(col);
        });

        servicesContainer.appendChild(row);

        // Add click handlers for all add-to-cart buttons
        row.querySelectorAll(".service-add-to-cart-btn").forEach(btn => {
            
            btn.addEventListener("click", function () {
                const serviceId = Number(this.dataset.serviceid);
                if (!serviceId) {
                    console.error("Invalid service ID on add-to-cart button.");
                    return;
                }
                addToCart(serviceId);
            });
        });
    }

    // Fetch services from API and cache them
    function fetchAndCacheServices() {
        fetch(`${API_BASE}/services/`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                // Adjust this if your API wraps services differently (e.g., data.data)
                const services = Array.isArray(data) ? data : data.data;
                if (!Array.isArray(services)) {
                    throw new Error("Invalid service data format from API");
                }

                sessionStorage.setItem(cacheKey, JSON.stringify(services));
                state.services = services;
                renderServices(services);
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                servicesContainer.innerHTML = `<div class="col-12 text-center"><p>Failed to load services.</p></div>`;
            });
    }

    // Show login modal or alert if user is not logged in
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

    // Add service to cart
    function addToCart(serviceId) {
        if (!requireLogin()) return;

        const quantityInput = document.getElementById(`quantity_${serviceId}`);
        const quantity = parseInt(quantityInput?.value, 10);
        if (isNaN(quantity) || quantity <= 0) {
            console.warn("Invalid quantity for service", serviceId);
            return;
        }

        const service = getServiceById(serviceId);
        if (!service) {
            console.error("Service not found for ID", serviceId);
            return;
        }

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

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Added to Cart!",
                text: `${quantity} ${service.name} has been added to your cart.`,
                icon: "success",
                confirmButtonText: "Continue Shopping",
                cancelButtonText: "Go to Cart",
                showCancelButton: true,
                customClass: { confirmButton: "afrobuild-btn-success" },
                buttonsStyling: true,
            }).then(result => {
                if (result.isDismissed) {
                    window.location.href = "/cart";
                }
            });
        } else {
            alert(`${quantity} ${service.name} added to cart.`);
        }
    }

    // Find a service by ID
    function getServiceById(serviceId) {
        return state.services.find(s => s.serviceid === serviceId) || null;
    }

    // Update cart count badge in header
    function updateCartCount() {
        if (!userId) return;

        const cart = JSON.parse(sessionStorage.getItem(`cart_${userId}`)) || {};
        const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElem = document.getElementById("cartCount");

        if (cartCountElem) {
            cartCountElem.textContent = count;
            cartCountElem.style.display = count > 0 ? "inline-block" : "none";

            // Bounce animation
            cartCountElem.classList.remove("cart-bounce");
            void cartCountElem.offsetWidth; // trigger reflow
            cartCountElem.classList.add("cart-bounce");
        }
    }

    // Initialize: load cached services or fetch fresh data
    (function init() {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const services = JSON.parse(cached);
                if (Array.isArray(services)) {
                    state.services = services;
                    renderServices(services);
                    return;
                }
                throw new Error("Cached services invalid");
            } catch {
                sessionStorage.removeItem(cacheKey);
            }
        }
        fetchAndCacheServices();
    })();
});
