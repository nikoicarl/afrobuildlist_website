document.addEventListener("DOMContentLoaded", () => {
    // ==== DOM ELEMENTS & CONSTANTS ====
    const wrapper = document.getElementById("carouselServices");
    if (!wrapper) return; // Exit if carousel wrapper not found

    const track = wrapper.querySelector(".afrobuild-carousel-track");
    const indicatorsContainer = document.getElementById("carouselIndicators");
    const cacheKey = "cachedServices";
    const placeholder = "assets/img/default-service-image.jpg";
    const SLIDE_INTERVAL = 5000;
    const userId = localStorage.getItem('userID');

    // ==== STATE ====
    const state = { services: [] };
    let currentIndex = 0;
    let totalSlides = 0;
    let interval;
    let cardsPerSlide = getCardsPerSlide();

    // ==== UTILS ====
    function getCardsPerSlide() {
        const width = window.innerWidth;
        if (width < 576) return 1;
        if (width < 768) return 2;
        if (width < 992) return 3;
        return 4;
    }

    // ==== CARD CREATION ====
    function createCarouselCard(service, totalItems) {
        const cardWidth = totalItems === 1 ? '100%' : `${100 / cardsPerSlide}%`;
        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents.split(",").map(f => f.trim())
                .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
        }
        const imageUrl = docsArray.length
            ? `/images/services/${docsArray[0]}`
            : placeholder;

        // Use data-service-id for event delegation
        return `
            <div class="col-lg-4 col-md-6 afrobuild-carousel-card" style="flex: 0 0 ${cardWidth}; max-width: ${cardWidth};" data-service-id="${service.id}">
                <div class="card h-100 border-0 afrobuild_service_page_service-card"
                    style="border-radius: 15px; overflow: hidden; max-height: 370px;">
                    <img src="${imageUrl}" class="card-img-top" style="height: 160px; object-fit: cover;"
                        alt="${service.name || 'Service'}">
                    <div class="card-body bg-white p-2">
                        <h5 class="card-title fw-bold mb-2">${service.name || "Unnamed Service"}</h5>
                        <p class="card-text text-muted small mb-3">${service.description || "No description provided."}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold afrobuild-product-price-amount">GH₵${service.price?.toFixed(2) || "0.00"}</span>
                            <div>
                                <input type="number" class="form-control service-quantity-input" value="1" min="1" style="width: 60px;">
                                <button class="afrobuild-btn afrobuild-btn-success mt-2 add-to-cart-btn" type="button">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==== INDICATORS ====
    function renderIndicators() {
        indicatorsContainer.innerHTML = "";
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement("div");
            indicator.className = "rounded-circle";
            indicator.style.cssText = `width: 12px; height: 12px; background: ${i === 0 ? "#222" : "#bbb"}; opacity: ${i === 0 ? "1" : "0.5"}; cursor: pointer;`;
            indicator.dataset.index = i;
            indicator.addEventListener("click", () => {
                clearInterval(interval);
                currentIndex = i;
                updateCarouselPosition();
                startAutoSlide();
            });
            indicatorsContainer.appendChild(indicator);
        }
        indicatorsContainer.style.display = totalSlides > 1 ? "flex" : "none";
    }

    function updateIndicators() {
        const dots = indicatorsContainer.children;
        for (let i = 0; i < dots.length; i++) {
            dots[i].style.background = i === currentIndex ? "#222" : "#bbb";
            dots[i].style.opacity = i === currentIndex ? "1" : "0.5";
        }
    }

    // ==== CAROUSEL ====
    function updateCarouselPosition() {
        const translateX = -(100 * currentIndex);
        track.style.transform = `translateX(${translateX}%)`;
        const cards = track.querySelectorAll(".afrobuild-carousel-card");
        cards.forEach((card, idx) => {
            const start = currentIndex * cardsPerSlide;
            const end = start + cardsPerSlide;
            if (idx >= start && idx < end) {
                card.classList.add("active");
            } else {
                card.classList.remove("active");
            }
        });
        updateIndicators();
    }

    function startAutoSlide() {
        if (interval) clearInterval(interval);
        if (totalSlides <= 1) return;
        interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarouselPosition();
        }, SLIDE_INTERVAL);
    }

    function renderCarousel(services) {
        if (!services || services.length === 0) {
            track.innerHTML = `<p class="text-muted" style="font-size:1.3em;">No services found.</p>`;
            track.style.width = `0%`;
            indicatorsContainer.innerHTML = "";
            indicatorsContainer.style.display = "none";
            if (interval) clearInterval(interval);
            return;
        }

        cardsPerSlide = getCardsPerSlide();
        track.innerHTML = services.map(service => createCarouselCard(service, services.length)).join("");
        totalSlides = Math.ceil(services.length / cardsPerSlide);
        currentIndex = 0;

        renderIndicators();
        updateCarouselPosition();
        startAutoSlide();

        // Pause auto-slide on hover
        const cards = track.querySelectorAll(".afrobuild-carousel-card");
        cards.forEach(card => {
            card.addEventListener("mouseenter", () => {
                if (interval) clearInterval(interval);
            });
            card.addEventListener("mouseleave", () => {
                startAutoSlide();
            });
        });
    }

    // ==== FETCH SERVICES ====
    async function fetchServices() {
        const cachedServices = localStorage.getItem(cacheKey);
        if (cachedServices) {
            try {
                const services = JSON.parse(cachedServices);
                state.services = services;
                renderCarousel(services);
                return;
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }

        // Fetch from API if not cached
        try {
            const response = await fetch(`${API_BASE}/services`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            const rawServices = result.data || [];

            state.services = rawServices.map(service => ({
                id: service.serviceid,
                name: service.name || 'Unnamed Service',
                description: service.description || '',
                price: service.price || 0,
                documents: service.documents || '',
            }));

            localStorage.setItem(cacheKey, JSON.stringify(state.services));
            renderCarousel(state.services);
        } catch (e) {
            track.innerHTML = `<p class="text-danger">Failed to load services.</p>`;
        }
    }

    // ==== CART FUNCTIONS ====
    function addToCart(serviceId, quantity) {
        if (!userId) {
            console.error("User ID not found in localStorage.");
            return;
        }
        if (isNaN(quantity) || quantity <= 0) return;

        // Get the service data by ID
        const service = getServiceById(serviceId);
        if (!service) return;

        let cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};

        if (cart[serviceId]) {
            cart[serviceId].quantity += quantity;
            cart[serviceId].totalPrice = cart[serviceId].price * cart[serviceId].quantity;
        } else {
            cart[serviceId] = {
                id: service.id,
                name: service.name,
                price: service.price,
                quantity: quantity,
                totalPrice: service.price * quantity
            };
        }

        localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
        updateCartCount(userId);

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
                    window.location.href = '/cart';
                }
            });
        } else {
            alert(`${quantity} ${service.name} added to cart.`);
        }
    }
    window.addToCart = addToCart; // For compatibility

    function getServiceById(serviceId) {
        const service = state.services.find(service => service.id === serviceId);
        if (!service) {
            console.error(`Service with ID ${serviceId} not found.`);
            return null;
        }
        return service;
    }

    function updateCartUI() {
        if (!userId) return;
        const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
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
        const totalPriceElem = document.getElementById('totalPrice');
        if (totalPriceElem) {
            const totalPrice = Object.values(cart).reduce((sum, item) => sum + item.totalPrice, 0);
            totalPriceElem.textContent = `₵${totalPrice.toFixed(2)}`;
        }
    }

    function updateCartCount(userId) {
        if (!userId) return;
        const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};
        const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElem = document.getElementById('cartCount');
        if (cartCountElem) {
            cartCountElem.textContent = count;
            cartCountElem.style.display = count > 0 ? 'inline-block' : 'none';
            cartCountElem.classList.remove('cart-bounce');
            void cartCountElem.offsetWidth;
            cartCountElem.classList.add('cart-bounce');
        }
    }

    // ==== EVENT DELEGATION FOR "ADD TO CART" BUTTONS ====
    track.addEventListener('click', function (e) {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const card = e.target.closest('.afrobuild-carousel-card');
            const serviceId = parseInt(card.dataset.serviceId, 10);
            const quantityInput = card.querySelector('input[type="number"]');
            const quantity = parseInt(quantityInput.value, 10);
            addToCart(serviceId, quantity);
        }
    });

    // ==== SEARCH ====
    const searchInput = document.getElementById("serviceSearchInput");
    const searchButton = searchInput?.nextElementSibling;

    function filterServices(query, serviceList) {
        if (!query) return serviceList;
        const lower = query.toLowerCase();
        return serviceList.filter(service => {
            const name = service.name?.toLowerCase() || "";
            const description = service.description?.toLowerCase() || "";
            const price = service.price !== undefined ? service.price.toString() : "";
            return (
                name.includes(lower) ||
                description.includes(lower) ||
                price.includes(lower)
            );
        });
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const allServices = JSON.parse(cached);
                const filtered = filterServices(query, allServices);
                renderCarousel(filtered);
            } catch (e) {
                console.error("Search failed due to invalid cache.");
            }
        }
    }

    // Debounce search for better UX
    let searchTimeout;
    if (searchButton && searchInput) {
        searchButton.addEventListener("click", handleSearch);
        searchInput.addEventListener("keydown", e => {
            if (e.key === "Enter") handleSearch();
        });
        searchInput.addEventListener("keyup", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(handleSearch, 200);
        });
    }

    // ==== WINDOW RESIZE HANDLING ====
    window.addEventListener("resize", () => {
        const newCardsPerSlide = getCardsPerSlide();
        if (newCardsPerSlide !== cardsPerSlide) {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const services = JSON.parse(cachedData);
                renderCarousel(services);
            }
        }
    });

    // ==== INITIAL LOAD ====
    fetchServices();
});
