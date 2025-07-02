document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.getElementById("carouselServices");
    const track = wrapper.querySelector(".afrobuild-carousel-track");
    const indicatorsContainer = document.getElementById("carouselIndicators");
    const cacheKey = "cachedServices";
    const placeholder = "assets/img/default-service-image.jpg";
    const SLIDE_INTERVAL = 5000;
    const userId = localStorage.getItem('userID');

    // App state
    const state = {
        services: [],
    };

    let currentIndex = 0;
    let totalSlides = 0;
    let interval;
    let cardsPerSlide = getCardsPerSlide();

    function getCardsPerSlide() {
        const width = window.innerWidth;
        if (width < 576) return 1;
        if (width < 768) return 2;
        if (width < 992) return 3;
        return 4;
    }

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

        return `
            <div class="col-lg-4 col-md-6 afrobuild-carousel-card" style="flex: 0 0 ${cardWidth}; max-width: ${cardWidth};">
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
                                <input type="number" id="quantity_${service.id}" class="form-control" value="1" min="1"
                                    style="width: 60px;">
                                <button class="afrobuild-btn afrobuild-btn-success mt-2" onclick="addToCart(${service.id})">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

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

        // 🔴 Pause auto-slide when user hovers on any card
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

    // Make addToCart globally accessible
    window.addToCart = function (serviceId) {
        if (!userId) {
            console.error("User ID not found in localStorage.");
            return;
        }
        const quantity = parseInt(document.getElementById(`quantity_${serviceId}`).value, 10);
        if (isNaN(quantity) || quantity <= 0) return;

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
        if (typeof updateCartCount === "function") updateCartCount(userId);

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
    };

    function getServiceById(serviceId) {
        return state.services.find(service => service.id === serviceId) || null;
    }

    // Initial load: always use cachedServices
    fetchServices();

    // Re-render on window resize, using cachedServices
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

    // SEARCH FUNCTIONALITY
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

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", handleSearch);
        searchInput.addEventListener("keydown", e => {
            if (e.key === "Enter") handleSearch();
        });
        searchInput.addEventListener("keyup", () => {
            handleSearch();
        });
    }
});
