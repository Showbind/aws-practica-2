export { productsWebPage, myProductsWebPage, loadUserSession, logUser, fetchGetAllProducts};

// Funcion SetUp de "productos.html"
async function productsWebPage() {

    const userData = loadUserSession();
    const userToken = userData["access_token"];
    const userId = userData["email"];

    document.getElementById("search_input").value = "";

};

// Funcion SetUp de "mis_productos.html"
async function myProductsWebPage() {
    const userData = loadUserSession();
    const userToken = userData["access_token"];
    const userId = userData["email"];

    // Cargar productos
    const products = await fetchGetAllProducts(userToken);
    if (products) { displayMyProducts(products, userId) };
}

// ----------------------------------------------------------

//                  FUNCIONES AUXILIARES

// ----------------------------------------------------------

// Cargar Usuario
function loadUserSession() {

    const userData = logUser();

    // Mostrar Nombre del Usuario
    const usernameTag = document.getElementById("username_tag");
    usernameTag.innerHTML = userData["name"];

    const logOut = document.getElementById("log_out");

    // Botón Cerrar Sesión
    logOut.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.clear();
        window.location.href = "login.html";
    });

    return userData
}

function logUser() {
    let userDataInLocalStorage = localStorage.getItem("userData");

    if (!userDataInLocalStorage) {
        console.error("Error: Acceso no autorizado");
        window.location.href = "login.html";
    };

    const userData = JSON.parse(userDataInLocalStorage);

    return userData;
}

// Mostrar los productos del "marketplace" aplicando los filtros del usuario
function displayProducts(products, userId) {

    // FILTROS
    let filterProducts = products.filter((item) => {
        return (item["idUser"] != userId) && (item["state"].toLowerCase() == "en venta");
    });

    filterProducts = filterByCategory(filterProducts);
    filterProducts = filterBySearch(filterProducts)

    // ORDENAR
    let sortProducts = sortByPrice(filterProducts);

    createProductsCards(sortProducts)
};

// Mostrar los productos creados por el Usuario
function displayMyProducts(products, userId) {

    let filterProducts = products.filter((item) => {
        return (item["idUser"] == userId) && (item["state"].toLowerCase() == "en venta");
    });

    createProductsCards(filterProducts, "edit")
}

// Añadir productos al DOM
function createProductsCards(products, mode = "buy") {

    // Elementos html
    const productsContainer = document.querySelector(".scrollabe_products");
    productsContainer.innerHTML = "";
    let productTemplate = document.getElementById("product_card_template");

    // Iniciar LocalStorage del "Shopping Cart" si no existe
    const shoppingCartKey = "shoppingCart";
    let shoppingCart = JSON.parse(localStorage.getItem(shoppingCartKey)) || { "products": [] };

    // Token LocalStorage
    const userToken = logUser()["access_token"];

    // Crear tarjetas de cada producto
    for (const item of products) {
        let productContent = productTemplate.content.cloneNode(true);
        let itemButton = productContent.querySelector(".add_to_cart_btn");
        const productId = item["_id"];

        // Características del Producto
        productContent.querySelector(".product_image").src = item["image"];
        productContent.querySelector(".product_title").textContent = item["name"];
        productContent.querySelector(".product_category").textContent = `Estado: ${item["category"]}`;
        productContent.querySelector(".product_status").textContent = item["state"];
        productContent.querySelector(".product_price").textContent = `${item["price"]} €`;

        if (mode == "buy") { // Pestaña "Productos"
            setupAddToCartButton(productId, itemButton, shoppingCartKey, shoppingCart);
        }
        else if (mode == "edit") { // Pestaña "Mis Productos"
            setupEditProductButtons(productId, userToken, itemButton, productContent)
        }

        productsContainer.appendChild(productContent);
    };
}

// Añadir funcionalidad al boton "Añadir a la cesta".
function setupAddToCartButton(itemId, itemButton, cartKey, cartLocalStorage) {

    // Deshabilitar botón de compra en objetos del carrito
    if (cartLocalStorage["products"].includes(itemId)) {
        itemButton.disabled = true
    }
    else {
        // Boton añadir al carrito
        itemButton.addEventListener("click", () => {
            itemButton.disabled = true;

            // Guardar IDs de los articulos del carrito al Local Storage
            cartLocalStorage["products"].push(itemId);
            localStorage.setItem(cartKey, JSON.stringify(cartLocalStorage));
        });
    };
}

// Añadir Funcionalidad para "Editar" y "Borrar" el producto.
function setupEditProductButtons(itemId, userToken, itemButton, productContent) {
    // Botones
    const buttonsDiv = productContent.querySelector(".buttons_container");
    const delItemButton = productContent.querySelector(".del_product_button");

    itemButton.addEventListener("click", () => {
        window.location.href = `edit.html?id=${itemId}`;
    });

    delItemButton.addEventListener("click", async () => {

        const isProductDeleted = await fetchDeleteProduct(userToken, itemId);
        if (isProductDeleted) {
            window.location.href = "my_products.html"
        }
    })

    buttonsDiv.appendChild(delItemButton)
}

function filterByCategory(products) {
    const category = document.getElementById("filter_by_category").value;
    let filteredProducts = structuredClone(products);

    if (category != "none") {
        filteredProducts = filteredProducts.filter((product) =>
            product["category"].toLowerCase() == category.toLowerCase()
        );
    }

    return filteredProducts;
}

function filterBySearch(products) {
    const searchValue = document.getElementById("search_input").value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); // Ignorar acentos y tildes
    let filteredProducts = structuredClone(products);

    if (searchValue != "") {
        filteredProducts = filteredProducts.filter((product) => {
            const productName = product["name"].trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            return productName.includes(searchValue);
        }
        );
    }

    return filteredProducts;
}

function sortByPrice(products) {
    const order = document.getElementById("sort_by_price").value;
    let sortProducts = structuredClone(products);

    if (order == "asc") {
        sortProducts = sortProducts.sort((a, b) => a["price"] - b["price"]);
    }
    else if (order == "desc") {
        sortProducts = sortProducts.sort((a, b) => b["price"] - a["price"]);
    }

    return sortProducts;
}

async function fetchGetAllProducts(authToken) {
    try {
        let response = await fetch("https://practicaprogramacionweb.duckdns.org/products", {
            headers: {
                "accept": "*/*",
                "Authorization": `Bearer ${authToken}`
            },
        });

        if (!response.ok) {
            if (response.status == 401) { // Token no válido o caducado
                localStorage.clear();
                window.location.href = "login.html";
            };

            return false;
        };

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Error: ", error);
    }
}

async function fetchDeleteProduct(authToken, productId) {
    try {
        const response = await fetch(`https://practicaprogramacionweb.duckdns.org/products/${productId}`, {
            method: 'DELETE',
            headers: {
                "accept": "*/*",
                "Authorization": `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            if (response.status == 401) { // Token no válido o caducado
                localStorage.clear();
                window.location.href = "login.html";
            }
            else if (response.status == 500) { // ID del Producto Invalido
                console.error(`Error ${response.status}`)
            }

            return false;
        };

        // HTTP OK
        return true;
    }
    catch (error) {
        console.error("Error: ", error);
        return false;
    };
}