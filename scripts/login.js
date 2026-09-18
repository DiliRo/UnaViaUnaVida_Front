const form = document.querySelector("#login-form")

form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombreUsuario = document.getElementById("username").value;
        const contrasena = document.getElementById("password").value;

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
            console.log(response.ok)
            console.log(data.token)
        } else {
            console.log("ni modo")
        }
    })