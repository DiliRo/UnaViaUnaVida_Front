const form = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nombreUsuario = document.getElementById("username").value;
    const contrasena = document.getElementById("password").value;

    localStorage
    const response = await fetch("http://localhost:3641/v1/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombreUsuario,
            contrasena
        })
    });

    const data = await response.json();

    if (response.ok) {
        
        localStorage.setItem('token', data.token);
        console.log(localStorage.getItem('token'));
        

        loginMessage.textContent = "Bienvenido, inicio de sesión correcto";

        loginMessage.className =
            "mb-[1rem] rounded-[0.5rem] bg-[#e0efe7] p-[1rem] font-semibold text-[#0f6840]";
            window.location.replace('./principal.html');
    } else {
        console.log("ni modo");

        loginMessage.textContent =
            "Usuario o contraseña incorrectos. Vuelve a intentarlo.";

        loginMessage.className =
            "mb-[1rem] rounded-[0.5rem] bg-[#fde8e9] p-[1rem] font-semibold text-[#a9242b]";
    }
});