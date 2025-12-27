import json
import paho.mqtt.client as mqtt
import time
import requests
from threading import Event
import datetime

# Imports
try:
    from .logger import Logger
except (ImportError, ModuleNotFoundError):
    Logger = None

class MqttSensorRead:
    def __init__(self, thread_event: Event = None):

        # Evento Hilo
        self.thread_event = thread_event

        # Configuración del cliente MQTT
        self.BROKER = "broker.emqx.io"
        self.PORT = 1883
        self.TOPICS = [  # Temas a los que se suscribirá el cliente
            "sensor/data/sen55",
            "sensor/data/gas_sensor",
        ]

        # Endpoint enviar datos
        self.LOGIN_URL = "http://web-api:8000/auth/login"
        self.URL = "http://web-api:8000/sensors/data/"
        self.bearer = None

        # Crear json logger
        if Logger:
            self.json_logger = Logger("mqtt-sensor", "jsonl")
        else:
            print("Fallo con la importación del módulo JsonSink")

    # Callback cuando se establece la conexión con el broker
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("Conexión exitosa al broker MQTT")

            # Suscribirse a los temas
            for topic in self.TOPICS:
                client.subscribe(topic)
                print(f"Suscrito al tema '{topic}'")
        else:
            print(f"Error de conexión, código: {rc}")

    # Callback cuando se recibe un mensaje en los temas suscritos
    def on_message(self, client, userdata, msg):
        print(f"Mensaje recibido en el tema '{msg.topic}':")
        print(msg.payload.decode("utf-8"))

        try:
            # Decodificar y convertir el mensaje de JSON a diccionario
            payload = json.loads(msg.payload.decode("utf-8"))
            sensor_data_msg = json.dumps(payload)
            
            timestamp = datetime.now().isoformat()

            # Enviar datos al server
            try:
                response = requests.post(
                    url=self.URL, 
                    headers={
                        "authorization": f"Bearer {self.bearer}",
                    },
                    json={
                        "timestamp": timestamp,
                        "data": payload
                    },
                )
            except requests.HTTPError as error:
                if response.status_code == 401:
                    print("Token expirado. Obteniendo uno nuevo...")
                    self.get_token()
                else:
                    print("Error al enviar los datos al servidor\n", error)

            if Logger:
                self.json_logger.log_data(str(sensor_data_msg) + "\n")
            else:
                print("Fallo con la importación del módulo JsonSink")

            print(sensor_data_msg)  # Mostrar el mensaje formateado
        except json.JSONDecodeError as e:
            print(f"Error decodificando JSON: {e}")

    def get_token(self):
        # Obtener jwt
        response = requests.post(
            url=self.LOGIN_URL, 
            json={
                "email": "api@example.com",
                "password": "123456"
            },
            timeout=1
        )

        if response.ok:
            data = response.json()
            self.bearer = data["access_token"]
            print("\nAutenticación exitosa.\n", flush=True)
        else:
            print("Error de autenticación:", response.status_code, response.text, flush=True)

    def run(self):
        # Crear un cliente MQTT
        self.client = mqtt.Client()

        # Asignar las funciones de callback
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        # Obtener token de autenticación
        while True:
            try:
                r = requests.get("http://web-api:8000/health", timeout=5)
                if r.status_code == 200:
                    print("El API esta listo")
                    break
            except requests.ConnectionError:
                print("El API no esta listo, reintentando...")

        time.sleep(2)
        self.get_token()
        
        # Conectar al broker MQTT
        self.client.connect(self.BROKER, self.PORT, 60)

        # Bucle principal para mantener la conexión y escuchar mensajes
        print("Esperando mensajes... Presiona Ctrl+C para salir")

        self.client.loop_start()  # Ejecutar bucle

        while True:
            time.sleep(1)
            if self.thread_event and self.thread_event.is_set():
                self.client.disconnect()
                print("\n Finalizando Broker MQTT... \n")
                break

def main():
    client = MqttSensorRead()
    client.run()

if __name__ == "__main__":
    main()
