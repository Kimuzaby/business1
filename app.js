let cart = JSON.parse(localStorage.getItem('cart_dona_cristy')) || [];
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountElement = document.getElementById('cart-count');
        const cartTotalElement = document.getElementById('cart-total');
        const btnWhatsApp = document.getElementById('btn-whatsapp');
        const btnEmpty = document.getElementById('btn-empty');
 
        function toggleCart() {
            cartSidebar.classList.toggle('active');
            cartOverlay.classList.toggle('active');
        }
 
        function addToCart(id, name, price) {
            const existing = cart.find(i => i.id === id);
            if (existing) { existing.quantity += 1; }
            else { cart.push({ id, name, price, quantity: 1 }); }
            saveAndRenderCart();
            if (!cartSidebar.classList.contains('active')) toggleCart();
        }
 
        function updateQuantity(id, change) {
            const idx = cart.findIndex(i => i.id === id);
            if (idx > -1) {
                cart[idx].quantity += change;
                if (cart[idx].quantity <= 0) cart.splice(idx, 1);
            }
            saveAndRenderCart();
        }
 
        function emptyCart() {
            if (confirm("¿Estás seguro de que deseas vaciar tu carrito?")) {
                cart = [];
                saveAndRenderCart();
            }
        }
 
        function saveAndRenderCart() {
            localStorage.setItem('cart_dona_cristy', JSON.stringify(cart));
            renderCartItems();
        }
 
        function renderCartItems() {
            cartItemsContainer.innerHTML = '';
            let total = 0, totalItems = 0;
 
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div style="text-align:center; padding: 50px 20px; color:#aaa;">
                        <div style="font-size:3rem; margin-bottom:12px;">🛒</div>
                        <p style="font-weight:600; color:#777; margin-bottom:6px;">Tu carrito está vacío</p>
                        <p style="font-size:0.88rem;">¡Agrega unos deliciosos chicharrones!</p>
                    </div>`;
                btnWhatsApp.disabled = true;
                btnEmpty.style.display = 'none';
            } else {
                btnWhatsApp.disabled = false;
                btnEmpty.style.display = 'block';
                cart.forEach(item => {
                    const subtotal = item.price * item.quantity;
                    total += subtotal;
                    totalItems += item.quantity;
                    cartItemsContainer.innerHTML += `
                        <div class="cart-item">
                            <div class="cart-item-title">${item.name}</div>
                            <div class="cart-item-controls">
                                <div class="qty-controls">
                                    <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                                    <span class="qty-display">${item.quantity}</span>
                                    <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                                </div>
                                <div class="item-price">$${subtotal.toFixed(2)}</div>
                            </div>
                        </div>`;
                });
            }
            cartCountElement.innerText = totalItems;
            cartTotalElement.innerText = `$${total.toFixed(2)}`;
        }
 
async function sendWhatsApp() {
    if (cart.length === 0) return;

    // 1. Preparar el objeto de datos para la "Data Maestra"
    const orderData = {
        id_pedido: Date.now(), // Genera un ID único basado en el tiempo
        fecha: new Date().toLocaleString(),
        cliente: "Cliente Web", // Podrías agregar un input de nombre después
        items: cart.map(item => `${item.quantity}x ${item.name}`).join(", "),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
        metodo_entrega: "Pendiente definir" 
    };

    // 2. Enviar a Google Sheets de forma asíncrona
    try {
        await fetch('https://sheetdb.io/api/v1/0kw3e6o9cjq4d', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [orderData] })
        });
        console.log("Datos guardados en reporte.");
    } catch (error) {
        console.error("Error al guardar datos:", error);
    }

    // 3. Proceder con el envío de WhatsApp original
    const phone = "50366775753";
    let messageText = "¡Hola Doña Cristy! \nQuisiera hacer el siguiente pedido:\n\n";
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        messageText += `▶ ${item.quantity}x ${item.name} - $${subtotal.toFixed(2)}\n`;
    });
    
    // Se agrega el total y el mensaje de confirmación
    messageText += `\nTotal a pagar: $${orderData.total}\n\nPor favor confírmeme el pedido y las opciones de entrega. ¡Gracias!`;
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
}