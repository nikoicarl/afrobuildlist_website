document.addEventListener("DOMContentLoaded", function () {
    const productsContainer = document.getElementById("productsContainer");
    const paginationContainer = document.createElement("div");
    paginationContainer.id = "paginationControls";
    paginationContainer.className = "text-center mt-4";
    productsContainer.after(paginationContainer);

    const cacheKey = "cachedProducts";
    const state = {
        products: [],
        page: 1,
        perPage: 8,
    };

    const userId = sessionStorage.getItem("userID");


    /** Create a product card element */
    function createCardElement(product) {
        let docsArray = [];
        if (product.documents && product.documents.trim()) {
            docsArray = product.documents
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);
        }

        const imageUrl = docsArray.length
            ? `/images/${docsArray[0]}`
            : "assets/img/default-service-image.jpg";// default if no images

        const card = document.createElement("div");
        card.className = "afrobuild-product-card h-100";
        card.innerHTML = `
            <div class="afrobuild-product-card-image">
                <img 
                    src="${imageUrl}" 
                    alt="${product?.name?.replace(/"/g, "&quot;") || "Product image"}" 
                    onerror="this.onerror=null;this.src='assets/img/default-service-image.jpg';" />
            </div>
            <div class="afrobuild-product-card-body">
                <h4 class="afrobuild-product-card-title">${product?.name || "Product Name"}</h4>
                <p class="afrobuild-product-card-description">${product?.description || "No description provided."}</p>
                <div class="afrobuild-product-card-footer">
                    <div class="afrobuild-product-card-price">
                        <span class="afrobuild-product-price-label">From</span>
                        <span class="afrobuild-product-price-amount">
                            GH₵${typeof product?.price === "number" ? product.price.toFixed(2) : "0.00"}
                        </span>
                    </div>
                    <div class="afrobuild-product-card-actions">
                        <div>
                            <button 
                                class="afrobuild-btn afrobuild-btn-primary afrobuild-btn-success mt-2 product-view-details-btn" 
                                data-productid="${product.productid}">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    /** Render paginated results on current page */
    function renderProducts() {
        const startIndex = (state.page - 1) * state.perPage;
        const endIndex = startIndex + state.perPage;
        const paginatedProducts = state.products.slice(startIndex, endIndex);

        productsContainer.innerHTML = "";

        if (!Array.isArray(paginatedProducts) || paginatedProducts.length === 0) {
            productsContainer.innerHTML = `<div class="col-12 text-center"><p>No products available.</p></div>`;
            return;
        }

        const firstRowProducts = paginatedProducts.slice(0, 4);
        const secondRowProducts = paginatedProducts.slice(4, 8);

        const row1 = document.createElement("div");
        row1.className = "row mb-4";
        firstRowProducts.forEach(product => {
            const col = document.createElement("div");
            col.className = "col-lg-3 col-md-6 col-12 mb-4 d-flex";
            col.appendChild(createCardElement(product));
            row1.appendChild(col);
        });

        const row2 = document.createElement("div");
        row2.className = "row";
        secondRowProducts.forEach(product => {
            const col = document.createElement("div");
            col.className = "col-lg-3 col-md-6 col-12 mb-4 d-flex";
            col.appendChild(createCardElement(product));
            row2.appendChild(col);
        });

        productsContainer.appendChild(row1);
        productsContainer.appendChild(row2);

        // View Details buttons
        productsContainer.querySelectorAll(".product-view-details-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const productId = Number(this.dataset.productid);
                if (!productId) return;
                showProductDetails(productId);
            });
        });

        renderPagination();
    }

    /** Pagination controls for prev/next */
    function renderPagination() {
        const totalPages = Math.ceil(state.products.length / state.perPage);
        const prevDisabled = state.page === 1;
        const nextDisabled = state.page >= totalPages;

        paginationContainer.innerHTML = `
            <button id="productPrevPageBtn" class="afrobuild-btn afrobuild-btn-success mx-1" ${prevDisabled ? "disabled" : ""}>
                ← Previous
            </button>
            <span class="mx-2 afrobuild-primary">Page ${state.page} of ${totalPages}</span>
            <button id="productNextPageBtn" class="afrobuild-btn afrobuild-btn-success mx-1" ${nextDisabled ? "disabled" : ""}>
                Next →
            </button>
        `;

        document.getElementById("productPrevPageBtn").addEventListener("click", () => {
            if (state.page > 1) {
                state.page--;
                renderProducts();
            }
        });

        document.getElementById("productNextPageBtn").addEventListener("click", () => {
            if (state.page < totalPages) {
                state.page++;
                renderProducts();
            }
        });
    }

    /** Pull products from API or cache */
    function fetchAndCacheProducts() {
        fetch(`${API_BASE}/products/`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const products = Array.isArray(data) ? data : data.data;
                if (!Array.isArray(products)) throw new Error("Invalid product format");

                sessionStorage.setItem(cacheKey, JSON.stringify(products));
                state.products = products;
                state.page = 1;
                renderProducts();
            })
            .catch(err => {
                console.error("Error fetching products:", err);
                productsContainer.innerHTML = `<div class="col-12 text-center"><p>Failed to load products.</p></div>`;
            });
    }

    function showProductDetails(productId) {
        const product = getProductById(productId);
        if (!product || typeof Swal === "undefined") return;

        let docsArray = [];
        if (product.documents && product.documents.trim()) {
            docsArray = product.documents.split(",").map(s => s.trim()).filter(Boolean);
        }
        const imageUrl = docsArray.length
            ? `/images/${docsArray[0]}`
            : "assets/img/default-service-image.jpg";

        const price = typeof product.price === "number" ? product.price.toFixed(2) : "0.00";
        const description = product.description || "No description provided.";
        const supplier = product.supplier?.toUcwords?.() || "Unknown Supplier";

        Swal.fire({
            title: product.name || "Product Details",
            html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 680px; text-align: left;">
                <div style="margin-bottom: 16px;">
                    <img 
                        src="${imageUrl}" 
                        alt="${product.name || "Product"}" 
                        style="width: 100%; max-height: 240px; object-fit: contain; border-radius: 6px; border: 1px solid #ddd;"
                        onerror="this.onerror=null;this.src='assets/img/default-service-image.jpg';"
                    />
                </div>
                <div style="margin-bottom: 14px;">
                    <h3 style="font-size: 16px; margin-bottom: 6px;">Description</h3>
                    <p style="font-size: 14px; color: #333; line-height: 1.5;">${description}</p>
                </div>
                <div style="margin-bottom: 14px;">
                    <h4 style="font-size: 15px; margin-bottom: 4px;">Supplier</h4>
                    <p style="font-size: 14px; color: #555; margin: 0;">${supplier}</p>
                </div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 15px; margin-bottom: 4px;">Price</h4>
                        <p style="font-size: 14px; color: #222;">GH₵ ${price}</p>
                    </div>
                    <div>
                        <label for="swal-quantity-input" style="font-size: 14px; font-weight: 500; display: block; margin-bottom: 6px;">
                            Quantity
                        </label>
                        <input 
                            id="swal-quantity-input" 
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
            confirmButtonText: "Add to Cart",
            cancelButtonText: "Close",
            customClass: {
                popup: "swal2-afrobuild",
                confirmButton: "afrobuild-btn-success afrobuild-btn",
                cancelButton: "afrobuild-btn-secondary afrobuild-btn"
            },
            preConfirm: () => {
                const qtyInput = document.getElementById("swal-quantity-input");
                const qty = parseInt(qtyInput?.value, 10);

                if (!qtyInput || isNaN(qty) || qty < 1) {
                    Swal.showValidationMessage("Please enter a valid quantity (1 or more).");
                    return false;
                }
                addToCart(productId, qty);
            }
        });
    }

    /** Add to cart with login requirement */
    function addToCart(productId, quantity = 1) {
        if (!requireLogin()) return;

        quantity = parseInt(quantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Invalid Quantity",
                    text: "Please enter a valid quantity (1 or more).",
                    confirmButtonText: "OK",
                    customClass: {
                        confirmButton: "afrobuild-btn-success"
                    }
                });
            } else {
                alert("Please enter a valid quantity (1 or more).");
            }
            return;
        }

        const product = getProductById(productId);
        if (!product) return;

        const userId = sessionStorage.getItem("userID");
        if (!userId) return; // Extra guard

        const cartKey = `cart_${userId}`;
        let cart = JSON.parse(sessionStorage.getItem(cartKey)) || {};

        if (cart[productId]) {
            cart[productId].quantity += quantity;
            cart[productId].totalPrice = cart[productId].price * cart[productId].quantity;
        } else {
            cart[productId] = {
                productid: product.productid,
                name: product.name,
                category: product.categoryid,
                item_type: "product",
                price: product.price,
                quantity: quantity,
                totalPrice: product.price * quantity,
            };
        }

        sessionStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartCount();

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Added to Cart!",
                text: `${quantity} ${product.name} has been added to your cart.`,
                icon: "success",
                confirmButtonText: "Continue Shopping",
                cancelButtonText: "Go to Cart",
                showCancelButton: true,
                customClass: {
                    confirmButton: "afrobuild-btn-success",
                    cancelButton: "afrobuild-btn-secondary"
                },
                buttonsStyling: true,
            }).then(result => {
                if (result.isDismissed) {
                    window.location.href = "/cart";
                }
            });
        } else {
            alert(`${quantity} ${product.name} added to cart.`);
        }
    }

    /** Ensure user is logged in */
    function requireLogin() {
        if (userId) return true;

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Please log in",
                text: "You need to log in to add items to your cart.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Login",
                cancelButtonText: "Cancel",
                customClass: {
                    confirmButton: "afrobuild-btn-success"
                },
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

    /** Find product by ID */
    function getProductById(productId) {
        return state.products.find(p => p.productid === productId) || null;
    }

    /** Update cart icon count */
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

    /** Search input filtering */
    function setupSearch() {
        const searchInput = document.getElementById("productsearchInput");
        if (!searchInput) return;

        searchInput.addEventListener("input", function () {
            const query = this.value.trim().toLowerCase();
            const allProducts = JSON.parse(sessionStorage.getItem(cacheKey)) || [];

            if (query === "") {
                state.products = allProducts;
            } else {
                state.products = allProducts.filter(product =>
                    (product.name && product.name.toLowerCase().includes(query)) ||
                    (product.description && product.description.toLowerCase().includes(query))
                );
            }

            state.page = 1;
            renderProducts();
        });
    }

    /** Initialization */
    (function init() {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const products = JSON.parse(cached);
                if (Array.isArray(products)) {
                    state.products = products;
                    state.page = 1;
                    renderProducts();
                    setupSearch();
                    return;
                }

                throw new Error("Invalid cached data");
            } catch {
                sessionStorage.removeItem(cacheKey);
            }
        }

        fetchAndCacheProducts();
        setupSearch();
    })();
});
