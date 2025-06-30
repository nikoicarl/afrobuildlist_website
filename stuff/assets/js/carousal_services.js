document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.getElementById("carouselServices");
    const track = wrapper.querySelector(".afrobuild-carousel-track");
    const indicatorsContainer = document.getElementById("carouselIndicators");
    const cacheKey = "cachedServices";
    const placeholder = "assets/img/default-service-image.jpg";
    const SLIDE_INTERVAL = 5000;

    let currentIndex = 0;
    let totalSlides = 0;
    let interval;
    let cardsPerSlide = getCardsPerSlide();

    function getCardsPerSlide() {
        const width = window.innerWidth;
        if (width < 576) return 1;         // Extra small devices
        if (width < 768) return 2;         // Small devices
        if (width < 992) return 3;         // Medium devices
        return 4;                          // Large screens and up
    }

    function createCarouselCard(service, totalItems) {
        const cardWidth = totalItems === 1 ? '100%' : `${100 / cardsPerSlide}%`;

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
            <div class="afrobuild-carousel-card" style="flex: 0 0 ${cardWidth}; max-width: ${cardWidth}; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1rem;">
                <img src="${imageUrl}" alt="${service.name || 'Service'}" style="width: 100%; max-width: 240px; height: auto; object-fit: cover; border-radius: 10px;">
                <div class="afrobuild-carousel-overlay" style="margin-top: 0.8rem;">
                    <h5 style="margin-bottom: 0.5rem;">${service.name || "Unnamed Service"}</h5>
                    <p style="font-size: 0.9rem; color: #666;">${service.description || "No description provided."}</p>
                    <div class="afrobuild-overlay-footer" style="margin-top: 0.5rem;">
                        <span class="afrobuild-price">
                        Est. GH₵${service.price?.toFixed(2) || "0.00"}
                        </span>
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
            indicator.style.cssText = `
                width: 12px;
                height: 12px;
                background: ${i === 0 ? "#222" : "#bbb"};
                opacity: ${i === 0 ? "1" : "0.5"};
                cursor: pointer;
            `;
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
            track.style.width = `${(services.length / cardsPerSlide) * 100}%`;
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
    }


    function fetchServices() {
        fetch(`${API_BASE}/services`)
            .then(res => res.json())
            .then(data => {
                const services = data.data || data;
                localStorage.setItem(cacheKey, JSON.stringify(services));
                renderCarousel(services);
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                track.innerHTML = `<p class="text-danger">Failed to load services.</p>`;
                indicatorsContainer.style.display = "none";
            });
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const services = JSON.parse(cached);
            renderCarousel(services);
        } catch (e) {
            localStorage.removeItem(cacheKey);
            fetchServices();
        }
    } else {
        fetchServices();
    }

    // Re-render on window resize
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
