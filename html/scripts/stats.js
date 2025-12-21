import { loadUserSession, fetchGetAllProducts } from "./products.js";
export { loadStatsPage };

function loadStatsPage() {
    const userData = loadUserSession();
    const userToken = userData["access_token"]
    let a = document.getElementById("mapDiv");
    a.innerHTML = "";

}

async function loadMap(userToken) {
    // Crear mapa
    const map = new ol.Map({
        target: 'mapDiv',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(), // OSM = OpenStreetMap 
            }),
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([-3.70256, 40.4165]), // Cordenadas Madrid para centrar el mapa en España
            zoom: 2,
        }),
    });

    // Crear y Posicionar un pin en el mapa
    function setLocationPin(longitud, latitud, color = "red") {
        // Crear icono pin
        const pin = document.createElement('i');
        pin.className = 'pin fa-solid fa-map-pin'; // Clases de Openstreetmap y de fontawesome
        pin.style.color = color;

        // Añadir pin al mapa
        const marker = new ol.Overlay({
            position: ol.proj.fromLonLat([longitud, latitud]),
            positioning: 'bottom-center',
            element: pin,
            stopEvent: false,
        });
        map.addOverlay(marker);
    }

    // Mostrar coordenadas de los usuarios en el mapa
    const coordinates = await fetchGetUsersCoordinates(userToken);
    for (const position of coordinates) {
        console.log(position);
        setLocationPin(position["longitude"], position["latitude"], "#f50f4c")
    }

}

async function loadStatsChart(authToken) {
    
    const chartDiv = document.getElementById('chartDiv');

    // Obtener datos para el grafico
    const products = await fetchGetAllProducts(authToken);
    const soldProducts = (products.filter(item => item["state"] == "Comprado")).length;
    const forSaleProducts = products.length - soldProducts;


    new Chart(chartDiv, {
        type: 'pie',
        data: {
            labels: ["En Venta","Vendidos"],
            datasets: [{
                label: '# of Products',
                data: [forSaleProducts, soldProducts],
                borderWidth: 1
            }]
        },
        options: {
            title:{
                display:true,
                text: "Productos Vendidos ",
            },
            responsive: true
        }
    });
}

async function fetchGetUsersCoordinates(authToken) {
    try {
        let response = await fetch("https://practicaprogramacionweb.duckdns.org/users/coords", {
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