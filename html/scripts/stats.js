export { loadStatsPage };

let myChart = null;
let lastMsg = null;

function loadStatsPage() {
    const userData = loadUserSession();
    const userToken = userData["access_token"]

    const sensorsSelect = document.getElementById('sensor_type_select');
    const fromDateTimeSelect = document.getElementById('from_datetime_select');

    sensorsSelect.addEventListener('change', () => {
        loadStatsChart(userToken);
    });

    fromDateTimeSelect.addEventListener('change', () => {
        loadStatsChart(userToken);
    });

    loadIotCoreMessage(userToken);
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

async function loadIotCoreMessage(authToken) {
    const iotCoreMsgTag = document.getElementById("iot_core_msg");
    setInterval(async() => {
        let msg = await fetchGetIotData(authToken)

        if (msg != lastMsg) {
            lastMsg = msg
            iotCoreMsgTag.textContent = JSON.stringify(msg, null, 2);
        }
    }, 1500)
}

async function loadStatsChart(authToken) {
    const chartCanvas = document.getElementById('chartCanvas');
    const sensorsSelect = document.getElementById('sensor_type_select');
    const fromDateTimeSelect = document.getElementById('from_datetime_select');

    let fromDate = 0;

    // Variables Sensores
    let sensors = []
    let datasets = []

    switch (sensorsSelect.value) {
        case "temperature_humidity":
            sensors = ["AmbientTemperature", "AmbientHumidity"]
            break;
        case "pm":
            sensors = ["MassConcentrationPm1p0", "MassConcentrationPm2p5", "MassConcentrationPm4p0", "MassConcentrationPm10p0"]
            break;
        case "gm":
            sensors = ["GM102B", "GM302B", "GM502B", "GM702B"]
            break;
    }

    // Timestamp actual
    const now = new Date();
    now.toISOString()

    switch (fromDateTimeSelect.value) {
        case "all":
            fromDate = 0
            break;
        case "7_days":
            const week = 7 * 24 * 60 * 60 * 1000;
            fromDate = new Date(now.getTime() - week).toISOString()
            break;
        case "24_hours":
            const day = 24 * 60 * 60 * 1000;
            fromDate = new Date(now.getTime() - day).toISOString()
            break;
        case "4_hours":
            const four_hours = 4 * 60 * 60 * 1000;
            fromDate = new Date(now.getTime() - four_hours).toISOString()
            break;
    }

    // Obtener datos para el grafico
    for await (const sensor of sensors) {
        let sensor_data = await fetchGetSensorData(sensor, fromDate, authToken)

        sensor_data.forEach(item => {
            // Modificar nombre claves
            item.x = item.timestamp;
            item.y = item.value;

            // Eliminar claves antiguas
            delete item.timestamp;
            delete item.value;
            delete item.sensor_id;
        });

        datasets.push({
            label: sensor,
            data: sensor_data,
            tension: 0.3,        // suaviza la línea
            pointRadius: 0,      // mejor rendimiento
            fill: false
        })
    }

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: datasets
        },
        options: {
            title: {
                display: true,
                text: "Histograma Sensores",
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

async function fetchGetIotData(authToken) {
    try {
        let response = await fetch(`/api/iot/`, {
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