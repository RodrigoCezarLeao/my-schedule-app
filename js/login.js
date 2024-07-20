const login = async () => {
    const pwd = document.getElementById("login_info").value

    query = `
        query MyQuery {
            myUsers(where: {identifyer: "${pwd}"})
            {
                id
                identifyer
            }
        }
    `
    const data = await baseDBRequest(query)

    const user = data.data.myUsers?.[0]
    if (!user) alert("Usuário não encontrado!")
    else {
        localStorage.setItem("MyTask_user", JSON.stringify(user))
        window.location.href = "tasks.html"
    }

}

const user = localStorage.getItem("MyTask_user")
if (user) window.location.href = "tasks.html"