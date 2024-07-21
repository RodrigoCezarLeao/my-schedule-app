const baseDBRequest = async (query) => {
    queryJson = JSON.stringify({query: query})

    const url = "https://sa-east-1.cdn.hygraph.com/content/clytcgmko00yu06w9j8dnrc3i/master"
    
    result = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            //"Authorization": `Bearer ${token}`
        },
        body: queryJson,
    })
    .then(data => data.json())
    .then(data => data)

    return result
}

const getCurrentDayStr = () => {
    const date = new Date()
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
}

const getCurrentUserIdentifyer = () => {
    const user = localStorage.getItem("MyTask_user")
    return JSON.parse(user)?.identifyer;
}

function createDateFromTimeString(timeString) {
    // Obter a data atual
    const currentDate = new Date();
    
    // Extrair a parte da data no formato YYYY-MM-DD
    const datePart = currentDate.toISOString().split('T')[0];
    
    // Combinar a parte da data com a string de horas
    const dateTimeString = `${datePart}T${timeString}`;
    
    // Criar um objeto Date usando a string completa de data e hora
    const dateTime = new Date(dateTimeString);
    
    return dateTime;
}