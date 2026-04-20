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
 

/* SendWhatsApp */

async function sendWhatsApp() {
    const clientName = document.getElementById('client-name').value;
    const deliveryMethod = document.getElementById('delivery-method').value;
    const deliveryDate = document.getElementById('delivery-date').value;
    const deliveryTime = document.getElementById('delivery-time').value;
    const locationDetails = document.getElementById('location-details').value;
    const paymentMethod = document.getElementById('payment-method').value;

    if (cart.length === 0 || !clientName || !deliveryMethod || !deliveryDate || !deliveryTime) {
        alert("Por favor completa todos los campos de contacto y fecha.");
        return;
    }

    const totalOrder = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    // 1. Objeto para la Data Maestra (Columnas separadas)
    const orderData = {
        id_pedido: Date.now(),
        fecha_registro: new Date().toLocaleDateString(),
        cliente: clientName,
        items: cart.map(item => `${item.quantity}x ${item.name}`).join(", "),
        total: totalOrder,
        metodo_entrega: deliveryMethod === "delivery" ? "A domicilio" : "Recoger en local",
        dia_entrega: deliveryDate,
        hora_entrega: deliveryTime,
        ubicacion: locationDetails,
        metodo_pago: paymentMethod
    };

    // 2. Registro en Google Sheets via SheetDB
    try {
        await fetch('https://sheetdb.io/api/v1/0kw3e6o9cjq4d', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [orderData] })
        });
    } catch (error) {
        console.error("Error en registro:", error);
    }

    // 3. Mensaje de WhatsApp
    const phone = "50366775753";
    let messageText = `*PEDIDO NUEVO: ${clientName}* 🐷\n\n`;
    cart.forEach(item => {
        messageText += `▶ ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });

    messageText += `\n*Total:* $${totalOrder}\n`;
    messageText += `*Pago:* ${paymentMethod}\n`;
    messageText += `*Entrega:* ${orderData.metodo_entrega}\n`;
    messageText += `*Día:* ${deliveryDate}\n`;
    messageText += `*Hora:* ${deliveryTime}\n`;
    if (locationDetails) messageText += `*Ubicación:* ${locationDetails}\n`;
    
    messageText += "\nPor favor confírmeme el pedido y las opciones de entrega. ¡Gracias!";
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, '_blank');
}


/* Toggle para el delivery */


function toggleDeliveryFields() {
    const method = document.getElementById('delivery-method').value;
    const detailsDiv = document.getElementById('extra-details');
    const label = document.getElementById('detail-label');

    if (method === "") {
        detailsDiv.style.display = "none";
    } else {
        detailsDiv.style.display = "block";
        label.innerText = method === "delivery" ? "Programación del Delivery:" : "Programación de Retiro en Local:";
    }
}