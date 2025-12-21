export { loginFormValidation, signInFormValidation };

//-------------------------- INICIAR SESIÓN ----------------------------

function loginFormValidation() {
    const form = document.querySelector('.signForm');
    const passwordInput = document.getElementById('password_create');
    const emailInput = document.getElementById('email');
    const formStatusMsg = document.getElementById("form_status_message");

    // Regex validación
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Al hacer "submit" en el form
    form.addEventListener('submit', event => {

        // Resetear mensaje de error servidor
        formStatusMsg.innerText = "";

        // Cancelar la recarga de pagina para manejar el "SUBMIT" 
        event.preventDefault();
        event.stopPropagation();

        // Validar formulario
        if (form.checkValidity()) {

            // CURL Body
            const userData = {
                email: emailInput.value.trim(),
                password: passwordInput.value.trim(),
            };

            // Enviar datos al servidor
            fetchLogInUser(userData, formStatusMsg)
                .then(isUserLoged => {
                    if (isUserLoged) {
                        // Redirigir a la página principal tras 1.5 segundos
                        setTimeout(() => {
                            window.location.href = "stats.html";
                        }, 1500);
                    }
                });
        }
        else { // DATOS NO VÁLIDOS

            // Clase validación datos Bootstrap
            form.classList.add('was-validated');
        }
    }, false);

    emailInput.addEventListener('input', () => {

        let errorMsg = 'Correo electrónico no válido.';
        validateInputValue(emailInput, emailRegex, errorMsg);
    });
};

//-------------------------- CREAR CUENTA ----------------------------

function signInFormValidation() {

    const form = document.querySelector('.signForm');
    const formStatusMsg = document.getElementById("form_status_message");

    // Datos usuario del formulario
    const userNameInput = document.getElementById('username');
    const emailInput = document.getElementById('email')
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('password_repeat');

    // Regex validación
    const userNameRegex = /^.{4,}$/; // Regex nombre de usuario: mínimo 4 caracteres
    const passwordRegex = /^.{6,}$/; // Regex contraseña: mínimo 6 carácteres
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Al enviar el formulario
    form.addEventListener('submit', event => {

        // Resetear mensaje de error servidor
        formStatusMsg.innerText = "";

        // Cancelar la recarga de pagina para manejar el "SUBMIT" 
        event.preventDefault();
        event.stopPropagation();

        // Validar formulario
        if (form.checkValidity()) {

            // CURL Body
            const userData = {
                name: userNameInput.value.trim(),
                email: emailInput.value,
                password: passwordInput.value,
            };

            // Enviar datos al servidor
            fetchCreateUser(userData, formStatusMsg)
                .then(isUserCreated => {
                    if (isUserCreated) {
                        // Redirigir a la página principal tras 1.5 segundos
                        setTimeout(() => {
                            window.location.href = "login.html";
                        }, 1500);
                    }
                });
        }
        else { // DATOS NO VÁLIDOS

            // Clase validación datos Bootstrap
            form.classList.add('was-validated');
        }

    }, false);

    // VALIDAR INPUTS 

    userNameInput.addEventListener('input', () => {

        let errorMsg = 'El nombre del usuario no cumple los requisitos.';
        validateInputValue(userNameInput, userNameRegex, errorMsg);
    });

    emailInput.addEventListener('input', () => {

        removeInputSpaces(emailInput);

        let errorMsg = 'Correo electrónico no válido.';
        validateInputValue(emailInput, emailRegex, errorMsg);
    });

    passwordInput.addEventListener('input', () => {

        removeInputSpaces(passwordInput);

        let errorMsg = 'La contraseña no cumple los requisitos.';
        validateInputValue(passwordInput, passwordRegex, errorMsg);
    });

    // Verificar que las contraseñas coinciden 
    repeatPasswordInput.addEventListener('input', () => {

        removeInputSpaces(repeatPasswordInput)

        if (passwordInput.value === repeatPasswordInput.value) {
            repeatPasswordInput.setCustomValidity('');
        }
        else {
            repeatPasswordInput.setCustomValidity('Las contraseñas no coinciden.');
        }
    });
};

// ----------------------------------------------------------

//                  FUNCIONES AUXILIARES

// ----------------------------------------------------------

// Elimina y bloquea los espacios dentro del input
function removeInputSpaces(inputElement) {
    inputElement.value = inputElement.value.replace(/\s/g, '');
}

// Valida un input y muestra un error en el formulario si no es válido 
function validateInputValue(inputElement, regex, errorMsg = "Datos no válidos.") {
    if (regex.test(inputElement.value)) {
        inputElement.setCustomValidity('');
    }
    else {
        inputElement.setCustomValidity(errorMsg);
    }
}

// Devuelve "true" si el usuario se ha creado con éxito
async function fetchCreateUser(curlBody, formStatusMsg) {
    try {
        const response = await fetch('http://web-api:8000/api/auth/login', {
            method: 'POST',
            headers: {
                "accept": "*/*",
                "content-type": "application/json"
            },
            body: JSON.stringify(curlBody)
        });

        if (!response.ok) {
            if (response.status == 400) {

                formStatusMsg.innerText = "El nombre de usuario o correo electrónico ya existen.";
                formStatusMsg.classList.add("error_msg");
            };

            return false;
        };

        // HTTP OK
        formStatusMsg.innerText = "Usuario creado con éxito.";
        formStatusMsg.classList.add("success_msg");

        return true;
    }
    catch (error) {
        console.error("Error: ", error);
        return false;
    };
};

async function fetchLogInUser(curlBody, formStatusMsg) {
    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                "accept": "*/*",
                "content-type": "application/json"
            },
            body: JSON.stringify(curlBody)
        });

        if (!response.ok) {
            if (response.status == 400 || response.status == 401) { // Datos de usuario incorrectos

                formStatusMsg.innerText = "El correo electrónico o contraseña son incorrectos.";
                formStatusMsg.classList.add("error_msg");
            };

            return false;
        };

        // HTTP OK
        formStatusMsg.innerText = "Sesión Iniciada";
        formStatusMsg.classList.add("success_msg");

        // Guardar token en LocalStorage
        const data = await response.json();
        data["email"] = curlBody["email"];

        localStorage.clear();
        localStorage.setItem("userData", JSON.stringify(data));

        return true;
    }
    catch (error) {
        console.error("Error: ", error);
        return false;
    };
};