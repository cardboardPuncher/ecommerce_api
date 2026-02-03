// Global variables
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentProduct = null;

const API_URL = 'https://chornate.pythonanywhere.com/api/products/';
const REVIEWS_API_URL = 'https://chornate.pythonanywhere.com/api/reviews/';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    fetchProducts();
    setupEventListeners();
    checkLoginStatus();
    fetchCart();
});

// Helper function to make HTTP requests
function makeRequest(method, url, headers, body, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    if (headers) {
        for (var key in headers) {
            xhr.setRequestHeader(key, headers[key]);
        }
    }

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            var data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            callback(null, data);
        } else {
            callback(new Error('Request failed'), null);
        }
    };

    xhr.onerror = function () {
        callback(new Error('Network error'), null);
    };

    xhr.send(body);
}

function fetchProducts() {
    makeRequest('GET', API_URL, null, null, function (error, data) {
        if (error) {
            console.error('Error fetching products:', error);
            return;
        }

        products = data.results ? data.results.map(function (item) {
            return {
                id: item.id,
                brand: item.brand || 'Genre',
                platform: item.platform || 'PC',
                name: item.title,
                price: item.price,
                formattedPrice: 'ETB ' + item.price,
                image: item.image_url || '',
                description: item.description,
                stock: item.stock_quantity
            };
        }) : [];

        renderProducts();
    });
}

function renderProducts() {
    var productGrid = document.getElementById('productGrid');
    if (!productGrid) return;
    productGrid.innerHTML = '';

    products.forEach(function (product) {
        var col = document.createElement('div');
        col.className = 'column is-12-mobile is-6-tablet is-3-desktop';
        col.innerHTML = `
            <div class="card has-background-dark h-100" style="cursor: pointer; border: 1px solid rgba(255,255,255,0.1);">
                <div class="card-image">
                    <figure class="image is-4by3" style="background: #1a1a1a;">
                        <img src="${product.image}" alt="${product.name}" style="object-fit: cover; height: 100%; width: 100%;">
                    </figure>
                </div>
                <div class="card-content">
                    <p class="is-size-7 has-text-primary has-text-weight-bold mb-1">${product.platform} • ${product.brand}</p>
                    <h5 class="title is-5 has-text-white mb-3">${product.name}</h5>
                    <div class="is-flex is-justify-content-space-between is-align-items-center">
                        <span class="has-text-white has-text-weight-bold">${product.formattedPrice}</span>
                    </div>
                </div>
            </div>`;
        col.addEventListener('click', function () {
            openProduct(product);
        });
        productGrid.appendChild(col);
    });
}

function openProduct(product) {
    currentProduct = product;

    const page = document.getElementById('product-page');
    // Selectors optimized for the refined Bulma structure
    page.querySelector('.title.is-2').innerText = product.name;
    page.querySelector('.title.is-3').innerText = product.formattedPrice;
    page.querySelector('.subtitle.is-5').innerText = product.description || 'No description available.';

    const stockTag = page.querySelector('.tag');
    if (stockTag) {
        stockTag.innerText = product.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK';
        stockTag.className = product.stock > 0 ? 'tag is-primary is-light has-text-weight-bold' : 'tag is-danger is-light has-text-weight-bold';
    }

    const img = page.querySelector('.column.is-6 img');
    if (img) {
        img.src = product.image || '';
        img.alt = product.name;
    }

    const addToCartBtn = page.querySelector('.button.is-primary.is-large');
    if (addToCartBtn) {
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
        newBtn.onclick = function () {
            addToCart(product);
        };
    }

    // Populate "Another Products" (Recommended) section
    renderRecommendedProducts(product.id);

    fetchReviews(product.id);
    navigateTo('product');
}

function renderRecommendedProducts(excludeId) {
    const grid = document.getElementById('anotherProductsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Get 4 random products that aren't the current one
    const recommended = products
        .filter(p => p.id !== excludeId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    recommended.forEach(function (product) {
        const col = document.createElement('div');
        col.className = 'column is-12-mobile is-6-tablet is-3-desktop';
        col.innerHTML = `
            <div class="card has-background-dark h-100" style="cursor: pointer; border: 1px solid rgba(255,255,255,0.1);">
                <div class="card-image">
                    <figure class="image is-4by3" style="background: #1a1a1a;">
                        <img src="${product.image}" alt="${product.name}" style="object-fit: cover; height: 100%; width: 100%;">
                    </figure>
                </div>
                <div class="card-content">
                    <p class="is-size-7 has-text-white-ter has-text-weight-bold mb-1">${product.platform} • ${product.brand}</p>
                    <h5 class="title is-6 has-text-white mb-3">${product.name}</h5>
                    <div class="is-flex is-justify-content-space-between is-align-items-center">
                        <span class="has-text-primary has-text-weight-bold">${product.formattedPrice}</span>
                    </div>
                </div>
            </div>`;
        col.addEventListener('click', function () {
            openProduct(product);
        });
        grid.appendChild(col);
    });
}

// Cart functions
function fetchCart() {
    var userStr = localStorage.getItem('user');
    if (!userStr) {
        renderBag();
        return;
    }

    var user = JSON.parse(userStr);
    var headers = { 'Authorization': 'Bearer ' + user.token };

    makeRequest('GET', 'https://chornate.pythonanywhere.com/api/cart/', headers, null, function (error, data) {
        if (error) {
            console.error("Fetch cart error", error);
            return;
        }

        cart = [];
        if (data.items) {
            data.items.forEach(function (item) {
                for (var i = 0; i < item.quantity; i++) {
                    cart.push({
                        id: item.product_info.id,
                        name: item.product_info.title,
                        brand: item.product_info.brand || 'Genre',
                        formattedPrice: 'ETB ' + item.price,
                        price: item.price,
                        image: item.product_info.image_url,
                        product_id: item.product_info.id
                    });
                }
            });
        }
        renderBag();
        updateCartCount();
    });
}

function addToCart(product) {
    var userStr = localStorage.getItem('user');

    cart.push(product);
    updateCartCount();
    alert('Product added to bag!');

    if (userStr) {
        var user = JSON.parse(userStr);
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user.token
        };
        var body = JSON.stringify({ product_id: product.id, quantity: 1 });

        makeRequest('POST', 'https://chornate.pythonanywhere.com/api/cart/add_item/', headers, body, function (error) {
            if (error) {
                console.error('Error adding to cart:', error);
            } else {
                fetchCart();
            }
        });
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}

function updateCartCount() {
    var count = document.getElementById('bag-count');
    if (count) count.innerText = cart.length;
}

function renderBag() {
    var cartItems = document.getElementById('cart-items');
    var subtotalEl = document.getElementById('cart-subtotal');
    var totalEl = document.getElementById('cart-total');

    if (!cartItems) return;

    cartItems.innerHTML = '';
    var total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="has-text-grey">Your bag is empty.</p>';
    } else {
        cart.forEach(function (item, index) {
            total += parseFloat(item.price);
            var itemEl = document.createElement('div');
            itemEl.className = 'box has-background-dark mb-4 p-0';
            itemEl.style.border = '1px solid rgba(255,255,255,0.1)';
            itemEl.innerHTML = `
                <div class="columns is-vcentered is-mobile m-0">
                    <div class="column is-3 p-0">
                        <figure class="image is-square">
                            <img src="${item.image || ''}" style="object-fit: cover; border-radius: 6px 0 0 6px;">
                        </figure>
                    </div>
                    <div class="column is-7 px-4">
                        <h5 class="title is-5 has-text-white mb-1">${item.name}</h5>
                        <p class="is-size-7 has-text-grey-light mb-1">${item.brand}</p>
                        <p class="has-text-primary has-text-weight-bold">${item.formattedPrice}</p>
                    </div>
                    <div class="column is-2 has-text-centered">
                        <button class="button is-ghost has-text-danger" onclick="removeFromCart(${index})">
                            <span class="icon"><i class="fas fa-trash"></i></span>
                        </button>
                    </div>
                </div>`;
            cartItems.appendChild(itemEl);
        });
    }

    subtotalEl.innerText = 'ETB ' + total.toFixed(2);
    totalEl.innerText = 'ETB ' + total.toFixed(2);
}

window.removeFromCart = function (index) {
    var product = cart[index];
    cart.splice(index, 1);
    updateCartCount();
    renderBag();

    var userStr = localStorage.getItem('user');
    if (userStr) {
        var user = JSON.parse(userStr);
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user.token
        };
        var body = JSON.stringify({ product_id: product.id || product.product_id });

        makeRequest('POST', 'https://chornate.pythonanywhere.com/api/cart/remove_item/', headers, body, function (error) {
            if (error) {
                console.error('Error removing from cart', error);
            } else {
                fetchCart();
            }
        });
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
};

// Reviews
function fetchReviews(productId) {
    var list = document.getElementById('reviews-list');
    if (!list) return;
    list.innerHTML = '<p class="has-text-grey">Loading reviews...</p>';

    makeRequest('GET', REVIEWS_API_URL + '?product=' + productId, null, null, function (error, data) {
        if (error) {
            console.error('Error fetching reviews:', error);
            list.innerHTML = '<p class="text-danger">Failed to load reviews.</p>';
            return;
        }

        var reviews = data.results || data;

        if (reviews.length === 0) {
            list.innerHTML = '<p class="has-text-grey">No reviews yet. Be the first to review!</p>';
        } else {
            list.innerHTML = reviews.map(function (r) {
                var stars = '';
                for (var i = 0; i < r.rating; i++) stars += '★';
                for (var i = r.rating; i < 5; i++) stars += '☆';

                return '<div class="card mb-3">' +
                    '<div class="card-body">' +
                    '<div class="d-flex justify-content-between">' +
                    '<h6 class="card-subtitle mb-2 has-text-grey">User ' + r.user + '</h6>' +
                    '<span class="has-text-warning">' + stars + '</span>' +
                    '</div>' +
                    '<p class="card-text">' + r.comment + '</p>' +
                    '<small class="has-text-grey">' + new Date(r.created_at).toLocaleDateString() + '</small>' +
                    '</div>' +
                    '</div>';
            }).join('');
        }
    });
}

function submitReview(event) {
    event.preventDefault();
    if (!currentProduct) return;

    var userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('You must be logged in to review.');
        navigateTo('login');
        return;
    }

    var rating = document.getElementById('review-rating').value;
    var comment = document.getElementById('review-comment').value;
    var user = JSON.parse(userStr);

    if (!user.token) {
        alert('Your session has expired. Please login again.');
        logout();
        return;
    }

    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + user.token
    };
    var body = JSON.stringify({
        product: currentProduct.id,
        rating: parseInt(rating),
        comment: comment
    });

    makeRequest('POST', REVIEWS_API_URL, headers, body, function (error) {
        if (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
            return;
        }

        alert('Review submitted!');
        document.getElementById('review-form').reset();
        fetchReviews(currentProduct.id);
    });
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page-content').forEach(function (el) {
        el.style.display = 'none';
    });

    var pageElement = document.getElementById(page + '-page');
    if (pageElement) {
        pageElement.style.display = 'block';
        window.scrollTo(0, 0);
    }

    if (page === 'bag') {
        renderBag();
    }
}

// Event listeners
function setupEventListeners() {
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = loginForm.querySelector('input[type="email"]').value;
            var password = loginForm.querySelector('input[type="password"]').value;

            var headers = { 'Content-Type': 'application/json' };
            var body = JSON.stringify({ email: email, password: password });

            makeRequest('POST', 'https://chornate.pythonanywhere.com/api/auth/login/', headers, body, function (error, data) {
                if (error || !data.access) {
                    alert(data && data.error ? data.error : 'Login failed');
                    return;
                }

                alert('Login successful!');
                localStorage.setItem('user', JSON.stringify({
                    username: data.username,
                    is_staff: data.is_staff,
                    token: data.access
                }));

                checkLoginStatus();
                fetchCart();
                navigateTo('home');
            });
        });
    }

    var signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var username = signupForm.querySelector('input[type="text"]').value;
            var email = signupForm.querySelector('input[type="email"]').value;
            var password = signupForm.querySelector('input[type="password"]').value;

            var headers = { 'Content-Type': 'application/json' };
            var body = JSON.stringify({ email: email, password: password, username: username });

            makeRequest('POST', 'https://chornate.pythonanywhere.com/api/auth/register/', headers, body, function (error, data) {
                if (error) {
                    alert('Registration failed');
                    return;
                }

                alert('Registration successful! Please login.');
                navigateTo('login');
            });
        });
    }

    var reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }

    var brandLogo = document.getElementById('brandLogo');
    if (brandLogo) {
        brandLogo.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('home');
        });
    }

    var searchForm = document.querySelector('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var query = searchForm.querySelector('.search-input').value;
            if (query) performSearch(query);
        });
    }
}

function checkLoginStatus() {
    var userStr = localStorage.getItem('user');
    var adminNavItem = document.getElementById('admin-nav-item');
    var loginLink = document.querySelector('a[onclick="navigateTo(\'login\')"]');

    if (userStr) {
        var user = JSON.parse(userStr);

        if (user.is_staff && adminNavItem) {
            adminNavItem.style.display = 'block';
        }

        if (loginLink) {
            loginLink.textContent = 'LOGOUT';
            loginLink.onclick = function (e) {
                e.preventDefault();
                logout();
            };
        }
    } else {
        if (adminNavItem) adminNavItem.style.display = 'none';

        if (loginLink) {
            loginLink.textContent = 'LOGIN';
            loginLink.setAttribute('onclick', "navigateTo('login')");
        }
    }
}

function logout() {
    localStorage.removeItem('user');
    alert('Logged out successfully');
    checkLoginStatus();
    navigateTo('home');
}

function performSearch(query) {
    var results = products.filter(function (p) {
        return p.name.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
            p.brand.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });

    document.getElementById('search-query-text').innerText = query;
    var grid = document.getElementById('searchResultsGrid');
    var noResults = document.getElementById('no-results');

    grid.innerHTML = '';

    if (results.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        results.forEach(function (product) {
            var col = document.createElement('div');
            col.className = 'column is-12-mobile is-6-tablet is-3-desktop';
            col.innerHTML = `
                <div class="card has-background-dark h-100" style="cursor: pointer; border: 1px solid rgba(255,255,255,0.1);">
                    <div class="card-image">
                        <figure class="image is-4by3" style="background: #1a1a1a;">
                            <img src="${product.image}" alt="${product.name}" style="object-fit: cover; height: 100%; width: 100%;">
                        </figure>
                    </div>
                    <div class="card-content">
                        <p class="is-size-7 has-text-primary has-text-weight-bold mb-1">${product.platform} • ${product.brand}</p>
                        <h5 class="title is-5 has-text-white mb-3">${product.name}</h5>
                        <div class="is-flex is-justify-content-space-between is-align-items-center">
                            <span class="has-text-white has-text-weight-bold">${product.formattedPrice}</span>
                        </div>
                    </div>
                </div>`;
            col.addEventListener('click', function () {
                openProduct(product);
            });
            grid.appendChild(col);
        });
    }

    navigateTo('search-results');
}
