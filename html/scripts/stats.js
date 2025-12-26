export { loadStatsPage };

function loadStatsPage() {
    const userData = loadUserSession();
    const userToken = userData["access_token"]


    loadStatsChart(userToken);
}

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

async function loadStatsChart(authToken) {

    const chartCanvas = document.getElementById('chartCanvas');

    // Obtener datos para el grafico
    let sensorData = await fetchGetSensorData("MassConcentrationPm1p0", 0, authToken);

    let a = []
    let b
    for (const data of sensorData) {
        b = {
            "x": data.timestamp,
            "y": data.value
        }

        a.push(b)
    }
    console.log(sensorData);

    new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura (°C)',
                data: a,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.3,        // suaviza la línea
                pointRadius: 0,      // mejor rendimiento
                fill: false
            }]
        },
        options: {
            title: {
                display: true,
                text: "Productos Vendidos ",
            },
            responsive: true
        }
    });
}

async function fetchGetSensorData(sensorId, dateTime = 0, authToken) {
    try {
        let response = await fetch(`/api/sensors/${sensorId}/?start_time=${dateTime}`, {
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