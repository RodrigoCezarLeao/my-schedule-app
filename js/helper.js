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