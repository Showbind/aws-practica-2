import datetime
import os


class Logger:
    """Saves data in json/jsonl/log files. It does not format the data to json"""

    def __init__(self, key_name: str = "", file_type: str = "json"):
        """

        Args:
            key_name (str, optional): File name prefix.
            file_type (str, optional):File type 'json' or 'jsonl'. Defaults to "json".
        """

        if file_type not in ("json", "jsonl", "log"):
            raise ValueError("File type must be 'json' or 'jsonl'")

        # Variables
        self.file_index = 0 # Contador de archivos

        # Date actual
        dt = datetime.datetime.now()

        # Crear Carpeta Logs
        main_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.route = os.path.join(main_folder, "logs")

        os.makedirs(self.route, exist_ok=True)

        # Componentes Nombre del Archivo
        self.key_name = key_name
        self.file_type = file_type
        self.time_stamp = f"{dt.strftime("%Y")}-{dt.strftime("%m")}-{dt.strftime("%d")}"

        self.filename = f"{self.key_name}_{self.time_stamp}.{self.file_type}"

    def log_data(self, data_to_log):
        """Writes data into the log file

        Args:
            data_to_log (str):
        """

        self.ensure_file_under_max_size()

        with open(os.path.join(self.route, self.filename), "a") as f:
            f.write(data_to_log)

    def ensure_file_under_max_size(self):
        """Changes to other file if size is bigger than 1 MB."""

        MEGABYTE_SIZE = 10**6

        while True:  # Encontrar un archivo que pese menos de 1 MB.

            try:
                file_size = os.path.getsize(os.path.join(self.route, self.filename))
            except FileNotFoundError:  # Se crea un archivo nuevo
                break

            if file_size < MEGABYTE_SIZE:
                break
            
            # Cambiar nombre del archivo
            self.file_index += 1
            self.filename = f"{self.key_name}_{self.file_index}_{self.time_stamp}.{self.file_type}"
