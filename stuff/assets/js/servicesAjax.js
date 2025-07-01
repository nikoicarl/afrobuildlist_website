document.addEventListener("DOMContentLoaded", function () {
    const servicesContainer = document.getElementById("servicesContainer");
    const cacheKey = "cachedServices";
    const state = { services: [] }; // Store services for getServiceById

    // Helper to create a card DOM element
    function createCardElement(service) {
        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }
        const imageUrl = docsArray.length
            ? `/images/services/${docsArray[0]}`
            : 'assets/img/default-service-image.jpg';

        // Create card container
        const card = document.createElement('div');
        card.className = "afrobuild-product-card h-100";

        card.innerHTML = `
            <div class="afrobuild-product-card-image">
                <img src="${imageUrl}" alt="${service?.name ? service.name.replace(/"/g, '&quot;') : 'Service image'}" />
            </div>
            <div class="afrobuild-product-card-body">
                <h4 class="afrobuild-product-card-title">${service?.name || 'Service Name'}</h4>
                <p class="afrobuild-product-card-description">${service?.description || 'No description provided.'}</p>
                <div class="afrobuild-product-card-footer">
                    <div class="afrobuild-product-card-price">
                        <span class="afrobuild-product-price-label">From</span>
                        <span class="afrobuild-product-price-amount">GH₵${typeof service?.price === 'number' ? service.price.toFixed(2) : '0.00'}</span>
                    </div>
                    <div class="afrobuild-product-card-actions">
                        <div>
                            <input type="number" id="quantity_${service.serviceid}" class="form-control" value="1" min="1" style="width: 60px;">
                            <button class="afrobuild-btn afrobuild-btn-success mt-2 add-to-cart-btn" data-serviceid="${service.serviceid}">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    // Render all services in a simple equal grid
    function renderServices(services) {
        servicesContainer.innerHTML = "";
        if (!services || services.length === 0) {
            servicesContainer.innerHTML = `<div class="col-12 text-center"><p>No services available.</p></div>`;
            return;
        }

        const row = document.createElement('div');
        row.className = "row";

        services.forEach(service => {
            const col = document.createElement('div');
            // 3 per row on desktop, 2 on tablet, 1 on mobile
            col.className = "col-lg-3 col-md-6 col-12 mb-4 d-flex";
            col.appendChild(createCardElement(service));
            row.appendChild(col);
        });

        servicesContainer.appendChild(row);

        // Attach event listeners to all "Add to Cart" buttons
        row.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                addToCart(Number(this.dataset.serviceid));
            });
        });
    }

    // Fetch and cache services
    function fetchAndCacheServices() {
        fetch(`${API_BASE}/services`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                    state.services = data; // Save to state
                }
                renderServices(data);
            })
            .catch(error => {
                console.error('Error fetching services:', error);
                servicesContainer.innerHTML = `<div class="col-12 text-center"><p>Failed to load services.</p></div>`;
            });
    }

    // Function to add service to the cart
    function addToCart(serviceId) {
        const userId = localStorage.getItem('userID'); // Get the unique user ID from localStorage
        if (!userId) {
            console.error("User ID not found in localStorage.");
            return; // If there's no userId, exit (you can handle login or prompt here)
        }

        const quantityInput = document.getElementById(`quantity_${serviceId}`);
        const quantity = parseInt(quantityInput?.value, 10) || 1;
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
                id: service.serviceid,
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
        if (typeof Swal !== "undefined") {
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
        } else {
            alert(`${quantity} ${service.name} added to cart.`);
        }
    }

    // Function to get service details by ID
    function getServiceById(serviceId) {
        const service = state.services.find(service => service.serviceid === serviceId);
        if (!service) {
            console.error(`Service with ID ${serviceId} not found.`);
            return null;
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
        if (!cartItemsContainer) return;

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
        const totalPriceElem = document.getElementById('totalPrice');
        if (totalPriceElem)
            totalPriceElem.textContent = `₵${totalPrice.toFixed(2)}`;
    }

    // Function to update cart count in the header (dummy implementation)
    function updateCartCount() {
        // Example: update a badge with id 'cartCount'
        const userId = localStorage.getItem('userID');
        if (!userId) return;
        const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};
        const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElem = document.getElementById('cartCount');
        if (cartCountElem) cartCountElem.textContent = count;
    }

    // Main logic
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const services = JSON.parse(cached);
            state.services = services; // Save to state
            renderServices(services);
        } catch (e) {
            localStorage.removeItem(cacheKey);
            fetchAndCacheServices();
        }
    } else {
        fetchAndCacheServices();
    }
});
