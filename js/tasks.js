const user = localStorage.getItem("MyTask_user")
if (!user) window.location.href = "index.html"


const getUserDayTasks = async () => {
    query = `
        query MyQuery {
            tasks(where: {myUser: {identifyer: "${getCurrentUserIdentifyer()}"}, date: "${getCurrentDayStr()}"}) {
                id    
                title
                historic
                date
            }
        }
    `

    const data = await baseDBRequest(query)
    const result = data.data.tasks
    renderLoadedTasksFromDB(result)
}


getUserDayTasks()


const renderLoadedTasksFromDB = (tasks) => {
    const tbody = document.getElementById("tbody")

    for(let task of tasks){
        const title = task.title
        const historic = task.historic
    
        let historicHTML = ""
        if (historic) {
            for(let hist of historic){
                historicHTML += `
                <div>
                    <span>${hist.interval}</span>
                    <input type='text' value='${hist.description}' />
                </div>
                `
            }
        }

        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${title}</td>
            <td><button onclick='startTaskClock(this.parentElement.parentElement)'>Iniciar</button></td>
            <td>${historicHTML}</td>
            <td>${task.id}</td>
        `

        tbody.appendChild(tr)
    }
}

const addTaskInDB = async (title) => {
    query = `
        mutation MyMutation {
            createTask(
                data: {date: "${getCurrentDayStr()}", title: "${title}", myUser: {connect: {identifyer: "${getCurrentUserIdentifyer()}"}}}
            ) {
                id
            }
        }
    `

    const data = await baseDBRequest(query)
    const result = data?.data?.createTask?.id

    query = `
        mutation MyMutation {
            publishTask(where: {id: "${result}"})
            {
                id
            }
        }
    `
    const data2 = await baseDBRequest(query)
    const result2 = data2?.data?.publishTask?.id

    if (result2) alert("Tarefa criada com sucesso!")
    
    return result2
}


let refClock
let refCurrentTaskElem

const validateTaskAddInput = (taskTitle) => {
    if (taskTitle) return true
    return false
}

const addTask = async () => {
    const taskTitle = document.getElementById("task_input_add").value
    if (validateTaskAddInput(taskTitle))
    {
        const tbody = document.getElementById("tbody")
        const taskid = await addTaskInDB(taskTitle)

        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${taskTitle}</td>
            <td><button onclick='startTaskClock(this.parentElement.parentElement)' ${thereIsAnyTaskRunning() ? 'disabled' : ''}>Iniciar</button></td>
            <td></td>
            <td>${taskid}</td>
        `
        tbody.appendChild(tr)
        
    }else {
        alert("Tarefa precisa ter um nome!")
    }

}


const startTaskClock = (tr) => {
    const td = tr.children[2]
    const currentTs = new Date()

    const startTaskString = formatDateDiff(currentTs)
    const div = document.createElement("div")
    div.innerHTML = `
        <span>${startTaskString}</span>
        <input type='text' />
    `

    refClock = setInterval(() => {
        const newDateTaskString = formatDateDiff(currentTs)
        div.children[0].textContent = newDateTaskString
    }, 1000)


    td.appendChild(div)
    modifyAllButtons(true)
    refCurrentTaskElem = tr
}

const formatDateDiff = (date1) => {
    const currentTs = new Date()

    const startDate = `${date1.getHours().toString().padStart(2, "0")}:${date1.getMinutes().toString().padStart(2, "0")}:${date1.getSeconds().toString().padStart(2, "0")}`
    const finalDate = `${currentTs.getHours().toString().padStart(2, "0")}:${currentTs.getMinutes().toString().padStart(2, "0")}:${currentTs.getSeconds().toString().padStart(2, "0")}`

    const diffHours = new Date(currentTs - date1).getUTCHours()
    const diffMinutes = new Date(currentTs - date1).getUTCMinutes()
    const diffSeconds = new Date(currentTs - date1).getUTCSeconds()

    const diffHoursString = diffHours > 0 ? `${diffHours}h ` : ''
    const diffMinutesString = diffMinutes > 0 ? `${diffMinutes}min ` : ''
    const diffSecondsString = diffSeconds > 0 ? `${diffSeconds}s` : ''

    return `${startDate} - ${finalDate} [${diffHoursString}${diffMinutesString}${diffSecondsString}]`
}

const stopTaskClock = () => {
    clearInterval(refClock)
    refClock = undefined
}

const pauseTask = () => {
    stopTaskClock()
    modifyAllButtons(false)

    updateTaskInDB()
}

const modifyAllButtons = (flag) => {
    const tbody = document.getElementById("tbody")

    for(let tr of tbody.children){
        tr.children[1].children[0].disabled = flag
    }
}

const thereIsAnyTaskRunning = () => {
    if (!refClock) return false
    return true
}

const updateTaskInDB = async () => {
    refCurrentTaskElem
}