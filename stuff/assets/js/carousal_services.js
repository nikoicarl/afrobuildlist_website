document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.getElementById("carouselServices");
    if (!wrapper) return;

    const track = wrapper.querySelector(".d-flex");
    const indicatorsContainer = document.getElementById("carouselIndicators");
    const cacheKey = "cachedServices";
    const placeholder = "assets/img/default-service-image.jpg";
    const SLIDE_INTERVAL = 5000;
    const userId = localStorage.getItem("userID");

    const state = { services: [] };
    let currentIndex = 0;
    let totalSlides = 0;
    let cardsPerSlide = carouselGetCardsPerSlide();
    let interval;

    function carouselGetCardsPerSlide() {
        const width = window.innerWidth;
        if (width < 576) return 1;
        if (width < 768) return 2;
        if (width < 992) return 3;
        return 4;
    }

    function carouselCreateCard(service, cardsPerSlide) {
        const cardWidth = cardsPerSlide === 1 ? "100%" : `${100 / cardsPerSlide}%`;
        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents
                .split(",")
                .map(f => f.trim())
                .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
        }
        const imageUrl = docsArray.length
            ? `/images/services/${docsArray[0]}`
            : placeholder;

        return `
            <div class="d-flex flex-column px-2" style="flex: 0 0 ${cardWidth}; max-width: ${cardWidth};" data-service-id="${service.id}">
                <div class="card h-100 border-0" style="border-radius: 1.5rem; overflow: hidden; max-height: 370px;">
                <img 
                    src="${imageUrl}" 
                    class="card-img-top" 
                    style="height: 160px; width: 100%; object-fit: cover; background-color: #f8f9fa;" 
                    alt="${service.name || 'Service'}"
                >
                <div class="card-body m-2 bg-white p-2">
                    <h5 class="card-title fw-bold mb-2">${service.name || "Unnamed Service"}</h5>
                    <p class="card-text text-muted small mb-3">${service.description || "No description provided."}</p>
                    <div class="d-flex justify-content-between align-items-start">
                    <span class="fw-bold" style="color: var(--primary-color);">GH₵${service.price?.toFixed(2) || "0.00"}</span>
                    <div class="d-flex flex-column align-items-end">
                        <input type="number" class="form-control form-control-sm mb-1" value="1" min="1" style="width: 70px;">
                        <button class="btn btn-sm  add-to-cart-btn" type="button" style="background-color: var(--primary-color); color: white;">Add to Cart</button>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        `;
    }

    function carouselRenderIndicators() {
        indicatorsContainer.innerHTML = "";
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement("div");
            indicator.className = "rounded-circle";
            indicator.style.cssText = `width: 12px; height: 12px; background: ${i === 0 ? "#222" : "#bbb"}; opacity: ${i === 0 ? "1" : "0.5"}; cursor: pointer;`;
            indicator.dataset.index = i;
            indicator.setAttribute("aria-label", `Go to slide ${i + 1}`);
            indicator.addEventListener("click", () => {
                clearInterval(interval);
                currentIndex = i;
                carouselUpdatePosition();
                carouselStartAutoSlide();
            });
            indicatorsContainer.appendChild(indicator);
        }
        indicatorsContainer.style.display = totalSlides > 1 ? "flex" : "none";
    }

    function carouselUpdateIndicators() {
        const dots = indicatorsContainer.children;
        for (let i = 0; i < dots.length; i++) {
            dots[i].style.background = i === currentIndex ? "#222" : "#bbb";
            dots[i].style.opacity = i === currentIndex ? "1" : "0.5";
        }
    }

    function carouselUpdatePosition() {
        const translateX = -(100 * currentIndex);
        track.style.transform = `translateX(${translateX}%)`;
        const cards = track.querySelectorAll("[data-service-id]");
        cards.forEach((card, idx) => {
            const start = currentIndex * cardsPerSlide;
            const end = start + cardsPerSlide;
            card.style.display = idx >= start && idx < end ? "block" : "none";
        });
        carouselUpdateIndicators();
    }

    function carouselStartAutoSlide() {
        if (interval) clearInterval(interval);
        if (totalSlides <= 1) return;
        interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalSlides;
            carouselUpdatePosition();
        }, SLIDE_INTERVAL);
    }

    function carouselRender(services) {
        if (!services || services.length === 0) {
            track.innerHTML = `<p class="text-muted" style="font-size:1.3em;">No services found.</p>`;
            indicatorsContainer.innerHTML = "";
            indicatorsContainer.style.display = "none";
            if (interval) clearInterval(interval);
            return;
        }

        cardsPerSlide = carouselGetCardsPerSlide();
        totalSlides = Math.ceil(services.length / cardsPerSlide);
        currentIndex = Math.min(currentIndex, totalSlides - 1);

        track.innerHTML = services.map(service => carouselCreateCard(service, cardsPerSlide)).join("");

        carouselRenderIndicators();
        carouselUpdatePosition();
        carouselStartAutoSlide();

        const cards = track.querySelectorAll("[data-service-id]");
        cards.forEach(card => {
            card.addEventListener("mouseenter", () => interval && clearInterval(interval));
            card.addEventListener("mouseleave", () => carouselStartAutoSlide());
        });
    }

    async function carouselFetchServices() {
        const cachedServices = localStorage.getItem(cacheKey);
        if (cachedServices) {
            try {
                const services = JSON.parse(cachedServices);
                if (Array.isArray(services)) {
                    state.services = services;
                    carouselRender(services);
                    return;
                } else {
                    throw new Error("Cached data is not an array");
                }
            } catch (e) {
                console.warn("Invalid cached data, clearing cache.", e);
                localStorage.removeItem(cacheKey);
            }
        }

        try {
            const response = await fetch(`${API_BASE}/services`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();
            const rawServices = Array.isArray(result.data) ? result.data : [];

            state.services = rawServices.map(service => ({
                id: service.serviceid,
                name: service.name || 'Unnamed Service',
                description: service.description || '',
                price: service.price || 0,
                documents: service.documents || '',
            }));

            localStorage.setItem(cacheKey, JSON.stringify(state.services));
            carouselRender(state.services);
        } catch (e) {
            console.error("Error fetching services:", e);
            track.innerHTML = `<p class="text-danger">Failed to load services.</p>`;
        }
    }

    function carouselAddToCart(serviceId, quantity) {
        if (!userId) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    title: "Please log in",
                    text: "You need to log in to add items to your cart.",
                    icon: "warning",
                    confirmButtonText: 'Login',
                    cancelButtonText: 'Cancel',
                    showCancelButton: true,
                    customClass: { confirmButton: 'afrobuild-btn-success' },
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

        if (isNaN(quantity) || quantity <= 0) return;

        const service = state.services.find(service => service.id === serviceId);
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
                quantity,
                totalPrice: service.price * quantity,
            };
        }

        localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
        carouselUpdateCartCount(userId);

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: 'Added to Cart!',
                text: `${quantity} ${service.name} has been added to your cart.`,
                icon: 'success',
                confirmButtonText: 'Continue Shopping',
                cancelButtonText: 'Go to Cart',
                showCancelButton: true,
                customClass: { confirmButton: 'afrobuild-btn-success' },
                buttonsStyling: true,
            }).then((result) => {
                if (result.isDismissed) window.location.href = '/cart';
            });
        } else {
            alert(`${quantity} ${service.name} added to cart.`);
        }
    }

    function carouselUpdateCartCount(userId) {
        const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || {};
        const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElem = document.getElementById('cartCount');
        if (cartCountElem) {
            cartCountElem.textContent = count;
            cartCountElem.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    track.addEventListener('click', function (e) {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const card = e.target.closest('[data-service-id]');
            const serviceId = parseInt(card.dataset.serviceId, 10);
            const quantityInput = card.querySelector('input[type="number"]');
            const quantity = parseInt(quantityInput.value, 10);
            carouselAddToCart(serviceId, quantity);
        }
    });

    const searchInput = document.getElementById("serviceSearchInput");
    const searchButton = searchInput?.nextElementSibling;

    function carouselFilterServices(query, list) {
        if (!query) return list;
        const q = query.toLowerCase();
        return list.filter(({ name = '', description = '', price }) =>
            name.toLowerCase().includes(q) ||
            description.toLowerCase().includes(q) ||
            String(price).includes(q)
        );
    }

    function carouselHandleSearch() {
        const query = searchInput.value.trim();
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const services = JSON.parse(cached);
                const filtered = carouselFilterServices(query, services);
                carouselRender(filtered);
            } catch {}
        }
    }

    let searchTimeout;
    if (searchButton && searchInput) {
        searchButton.addEventListener("click", carouselHandleSearch);
        searchInput.addEventListener("keydown", e => e.key === "Enter" && carouselHandleSearch());
        searchInput.addEventListener("keyup", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(carouselHandleSearch, 200);
        });
    }

    window.addEventListener("resize", () => {
        const newCount = carouselGetCardsPerSlide();
        if (newCount !== cardsPerSlide) {
            cardsPerSlide = newCount;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const services = JSON.parse(cached);
                totalSlides = Math.ceil(services.length / cardsPerSlide);
                if (currentIndex >= totalSlides) currentIndex = 0;
                carouselRender(services);
            }
        }
    });

    carouselFetchServices();
});
