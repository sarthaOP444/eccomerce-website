// --- SVG Icons ---
const SVG_HEART_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
const SVG_HEART_FILLED = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

// --- Generate 50 Unique Products with Galleries ---
const categories = ["t-shirt", "half-pants", "full-pants", "jeans", "trousers", "undergarments"];
const genders = ["mens", "womens"];
const products = [];

for (let i = 1; i <= 50; i++) {
    const category = categories[i % categories.length];
    const gender = genders[i % genders.length];
    
    // Using Picsum Seeds to guarantee 100% unique, unbreakable images for every product
    const mainImg = `https://picsum.photos/seed/brutal_main_${i}/400/500`;
    const gallery = [
        mainImg,
        `https://picsum.photos/seed/brutal_alt1_${i}/400/500`,
        `https://picsum.photos/seed/brutal_alt2_${i}/400/500`,
        `https://picsum.photos/seed/brutal_alt3_${i}/400/500`
    ];
    
    products.push({
        id: i,
        name: `BRUTAL ${category.replace('-', ' ').toUpperCase()} V${i}`,
        price: Math.floor(Math.random() * (120 - 25 + 1) + 25) + 0.99,
        gender: gender,
        category: category,
        image: mainImg,
        gallery: gallery,
        desc: `Unapologetic design. Built for concrete. Zero compromises. Edition ${i} of our core ${category} collection.`
    });
}

// --- Application State ---
let cart = [];
let wishlist = [];
let currentUser = null;
let currentGenderFilter = 'all';
let currentCategoryFilter = 'all';

let usersDB = JSON.parse(localStorage.getItem('brutal_users')) || {};

// --- DOM Elements ---
const productGrid = document.getElementById('product-grid');
const cartSidebar = document.getElementById('cart-sidebar');
const overlay = document.getElementById('overlay');
const toggleCartBtn = document.getElementById('toggle-cart');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElement = document.getElementById('cart-count');
const cartTotalElement = document.getElementById('cart-total');
const btnCheckout = document.getElementById('btn-checkout');

const authView = document.getElementById('auth-view');
const storeView = document.getElementById('store-view');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authError = document.getElementById('auth-error');

const toggleProfileBtn = document.getElementById('toggle-profile');
const profileDropdown = document.getElementById('profile-dropdown');
const userNameDisplay = document.getElementById('user-name-display');

const featureModal = document.getElementById('feature-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

// --- Initialization ---
function initializeApp() {
    const savedSession = localStorage.getItem('brutal_current_user');
    if (savedSession && usersDB[savedSession]) loginUser(savedSession);
    else showAuthView();
    
    document.getElementById('slider-track').innerHTML = `<span>NEW ARRIVALS ⚡ ZERO COMPROMISE ⚡ RAW MATERIALS ⚡ </span>`.repeat(4);
    renderProducts();
}

// --- Auth Logic ---
function loginUser(username) {
    currentUser = username;
    localStorage.setItem('brutal_current_user', username);
    
    // Ensure all DB fields exist for older accounts
    if(!usersDB[username].address) usersDB[username].address = "";
    if(!usersDB[username].fullName) usersDB[username].fullName = "";
    if(!usersDB[username].orders) usersDB[username].orders = [];
    wishlist = usersDB[username].wishlist || [];
    
    userNameDisplay.innerText = currentUser;
    authView.classList.remove('active');
    storeView.classList.add('active');
    storeView.style.display = 'block';
    authForm.reset();
    authError.style.display = 'none';
    renderProducts();
}

function showAuthView() {
    storeView.classList.remove('active');
    storeView.style.display = 'none';
    authView.classList.add('active');
}

function showError(msg) { authError.innerText = msg; authError.style.display = 'block'; }

tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active'); tabSignup.classList.remove('active');
    emailInput.style.display = 'none'; emailInput.required = false;
    authError.style.display = 'none';
});

tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active'); tabLogin.classList.remove('active');
    emailInput.style.display = 'block'; emailInput.required = true;
    authError.style.display = 'none';
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (tabSignup.classList.contains('active')) {
        if (usersDB[username]) return showError("USERNAME EXISTS.");
        usersDB[username] = { email: emailInput.value.trim(), password, wishlist: [], orders: [] };
        localStorage.setItem('brutal_users', JSON.stringify(usersDB));
        loginUser(username);
    } else {
        if (!usersDB[username]) return showError("ACCOUNT NOT FOUND.");
        if (usersDB[username].password !== password) return showError("INCORRECT PASSWORD.");
        loginUser(username);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null; cart = []; wishlist = [];
    localStorage.removeItem('brutal_current_user');
    profileDropdown.classList.remove('open'); closeCart(); updateCartUI();
    showAuthView(); tabLogin.click();
});

// --- Filtering Logic ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const parentId = e.target.parentElement.id;
        e.target.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        if(parentId === 'gender-filters') currentGenderFilter = e.target.dataset.filter;
        else if (parentId === 'category-filters') currentCategoryFilter = e.target.dataset.filter;
        renderProducts();
    });
});

// --- Product Rendering ---
function renderProducts() {
    productGrid.innerHTML = ''; 
    const fragment = document.createDocumentFragment();

    const filtered = products.filter(p => 
        (currentGenderFilter === 'all' || p.gender === currentGenderFilter) &&
        (currentCategoryFilter === 'all' || p.category === currentCategoryFilter)
    );

    filtered.forEach(product => {
        const isWishlisted = wishlist.includes(product.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.id);
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" loading="lazy" class="product-image-img" alt="${product.name}">
                <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(event, ${product.id})">
                    ${isWishlisted ? SVG_HEART_FILLED : SVG_HEART_EMPTY}
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="add-to-cart" onclick="addToCart(event, ${product.id})">ADD TO CART</button>
            </div>
        `;
        fragment.appendChild(card);
    });
    productGrid.appendChild(fragment);
}

// --- Interactions ---
window.changeMainImage = function(imgSrc) {
    document.getElementById('main-detail-img').src = imgSrc;
};

function openProductDetails(id) {
    const product = products.find(p => p.id === id);
    if(!product) return;
    
    const thumbnailsHtml = product.gallery.map(img => `
        <img src="${img}" class="thumb-img" onclick="changeMainImage('${img}')" alt="Thumbnail">
    `).join('');
    
    openFeatureModal(product.name, `
        <div class="product-detail-layout">
            <div class="product-detail-img-container">
                <img src="${product.image}" id="main-detail-img" class="product-detail-img" alt="${product.name}">
                <div class="product-gallery">
                    ${thumbnailsHtml}
                </div>
            </div>
            <div class="product-detail-info">
                <div>
                    <h2>$${product.price.toFixed(2)}</h2>
                    <p style="margin: 10px 0;"><strong>CAT:</strong> ${product.category.toUpperCase()} | <strong>GEN:</strong> ${product.gender.toUpperCase()}</p>
                    <p>${product.desc}</p>
                </div>
                <div class="action-buttons">
                    <button class="add-to-cart" style="flex:1;" onclick="addToCart(event, ${product.id}); closeFeatureModal();">ADD TO CART</button>
                    <button class="add-to-cart" style="flex:1; background: var(--color-primary); color: white;" onclick="buyNow(${product.id})">BUY NOW</button>
                </div>
            </div>
        </div>
    `);
}

window.buyNow = function(productId) {
    addToCart(null, productId);
    openCheckout();
};

window.toggleWishlist = function(event, productId) {
    event.stopPropagation(); 
    const index = wishlist.indexOf(productId);
    if(index > -1) wishlist.splice(index, 1);
    else wishlist.push(productId);
    
    if(currentUser) {
        usersDB[currentUser].wishlist = wishlist;
        localStorage.setItem('brutal_users', JSON.stringify(usersDB));
    }
    renderProducts();
};

window.addToCart = function(event, productId) {
    if(event) event.stopPropagation(); 
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });
    updateCartUI();
    openCart();
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
};

function updateCartUI() {
    cartCountElement.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartTotalElement.innerText = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) return cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div><strong>${item.name}</strong><br>$${item.price.toFixed(2)} x ${item.quantity}</div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">DEL</button>
        `;
        cartItemsContainer.appendChild(div);
    });
}

// --- Checkout System & Orders ---
btnCheckout.addEventListener('click', openCheckout);

function openCheckout() {
    if (cart.length === 0) return alert("CART IS EMPTY. GO BUY SOMETHING.");
    closeCart();
    const total = cartTotalElement.innerText;
    
    openFeatureModal("SECURE CHECKOUT", `
        <form id="checkout-form" class="settings-form">
            <h3>SHIPPING DETAILS</h3>
            <input type="text" placeholder="FULL NAME" required>
            <input type="text" placeholder="STREET ADDRESS" required>
            <div class="form-row">
                <input type="text" placeholder="CITY" required>
                <input type="text" placeholder="ZIP CODE" required>
            </div>
            
            <h3 style="margin-top: 1rem;">PAYMENT INFO (MOCK)</h3>
            <input type="text" placeholder="CARD NUMBER (16 DIGITS)" required maxlength="16">
            <div class="form-row">
                <input type="text" placeholder="MM/YY" required maxlength="5">
                <input type="text" placeholder="CVC" required maxlength="3">
            </div>
            
            <button type="submit" style="width:100%; padding: 1.2rem; background: var(--color-primary); color: white; margin-top: 1rem; font-size: 1.2rem;">PAY $${total}</button>
        </form>
    `);

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Save Order to History
        const newOrder = {
            id: 'ORD-' + Math.floor(Math.random() * 900000 + 100000),
            date: new Date().toLocaleDateString(),
            items: [...cart],
            total: total
        };
        
        usersDB[currentUser].orders = usersDB[currentUser].orders || [];
        usersDB[currentUser].orders.unshift(newOrder); // Add to beginning of array
        localStorage.setItem('brutal_users', JSON.stringify(usersDB));

        // Clear cart
        cart = []; 
        updateCartUI();
        
        // Show Success Modal
        openFeatureModal("PAYMENT SUCCESS", `
            <div style="text-align: center;">
                <h1 style="color: var(--color-primary); margin-bottom: 1rem;">ORDER CONFIRMED.</h1>
                <p>Your payment was brutally executed.</p>
                <p>Order ID: <strong>${newOrder.id}</strong></p>
                <p style="margin-top: 1rem;">You can view this in your Orders page.</p>
            </div>
        `);
    });
}


// --- Modals & Overlay ---
function openFeatureModal(title, contentHTML) {
    modalTitle.innerText = title;
    modalBody.innerHTML = contentHTML;
    featureModal.classList.add('open');
    overlay.classList.add('show');
    profileDropdown.classList.remove('open'); 
}
function closeFeatureModal() {
    featureModal.classList.remove('open');
    if(!cartSidebar.classList.contains('open')) overlay.classList.remove('show');
}
closeModalBtn.addEventListener('click', closeFeatureModal);

// Navigation Buttons
document.getElementById('btn-orders').addEventListener('click', () => {
    const orders = usersDB[currentUser].orders || [];
    if(orders.length === 0) return openFeatureModal("📦 MY ORDERS", `<p><strong>NO ACTIVE ORDERS FOUND.</strong></p>`);
    
    const html = orders.map(o => `
        <div class="order-card">
            <div class="order-header">
                <span>ID: ${o.id}</span>
                <span>${o.date}</span>
            </div>
            <div class="order-items">
                ${o.items.map(i => `${i.quantity}x ${i.name}`).join('<br>')}
            </div>
            <div class="order-total">TOTAL: $${o.total}</div>
        </div>
    `).join('');
    
    openFeatureModal("📦 MY ORDERS", html);
});

document.getElementById('btn-wishlist').addEventListener('click', () => {
    if(wishlist.length === 0) return openFeatureModal("❤️ WISHLIST", `<p><strong>YOUR WISHLIST IS EMPTY.</strong></p>`);
    const html = products.filter(p => wishlist.includes(p.id)).map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid black; padding: 10px 0; cursor: pointer;" onclick="openProductDetails(${p.id})">
            <span><strong>${p.name}</strong> - $${p.price.toFixed(2)}</span>
            <button class="remove-btn" onclick="toggleWishlist(event, ${p.id}); document.getElementById('btn-wishlist').click();">REMOVE</button>
        </div>
    `).join('');
    openFeatureModal("❤️ WISHLIST", html);
});

document.getElementById('btn-settings').addEventListener('click', () => {
    const user = usersDB[currentUser];
    openFeatureModal("⚙️ SETTINGS", `
        <form class="settings-form" id="settings-form">
            <label>ALIAS (USERNAME)</label>
            <input type="text" value="${currentUser}" disabled style="background:#ddd;">
            <label>FULL NAME</label>
            <input type="text" id="set-name" value="${user.fullName || ''}" placeholder="ENTER FULL NAME">
            <label>EMAIL ADDRESS</label>
            <input type="email" id="set-email" value="${user.email}" placeholder="EMAIL">
            <label>SHIPPING ADDRESS</label>
            <input type="text" id="set-address" value="${user.address || ''}" placeholder="STREET, CITY, ZIP">
            <button type="submit" style="width:100%; padding: 1rem; background: var(--color-primary); color: white;">SAVE SETTINGS</button>
        </form>
    `);
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        usersDB[currentUser].fullName = document.getElementById('set-name').value.trim();
        usersDB[currentUser].email = document.getElementById('set-email').value.trim();
        usersDB[currentUser].address = document.getElementById('set-address').value.trim();
        localStorage.setItem('brutal_users', JSON.stringify(usersDB));
        closeFeatureModal();
    });
});

toggleProfileBtn.addEventListener('click', (e) => { e.stopPropagation(); profileDropdown.classList.toggle('open'); });
document.addEventListener('click', (e) => { if (!profileDropdown.contains(e.target) && !toggleProfileBtn.contains(e.target)) profileDropdown.classList.remove('open'); });

function openCart() { cartSidebar.classList.add('open'); overlay.classList.add('show'); profileDropdown.classList.remove('open'); }
function closeCart() { cartSidebar.classList.remove('open'); if(!featureModal.classList.contains('open')) overlay.classList.remove('show'); }
toggleCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', () => { closeCart(); closeFeatureModal(); });
// --- Footer Policies ---
document.getElementById('link-terms').addEventListener('click', (e) => {
    e.preventDefault();
    openFeatureModal("TERMS OF SERVICE", `
        <p>By using BRUTAL.STORE, you agree to our unapologetic terms. We hold no liability for how much better you look than everyone else.</p>
        <br>
        <ul>
            <li>1. No whining.</li>
            <li>2. All sales are brutal.</li>
            <li>3. Prices and inventory update without warning.</li>
        </ul>
    `);
});

document.getElementById('link-privacy').addEventListener('click', (e) => {
    e.preventDefault();
    openFeatureModal("PRIVACY POLICY", `
        <p>We respect your privacy as much as we respect fast fashion (which is none, but legally we keep your data safe).</p>
        <br>
        <p>Your details are securely stored locally. We do not track you, because frankly, we don't care what you do outside this store.</p>
    `);
});

document.getElementById('link-return').addEventListener('click', (e) => {
    e.preventDefault();
    openFeatureModal("RETURN POLICY", `
        <p>No soft edges. No returns unless the item is genuinely defective.</p>
        <br>
        <p>If you just changed your mind, deal with it. If your item arrives ripped (and it wasn't supposed to be), contact our void support within 48 hours.</p>
    `);
});

// Start
initializeApp();