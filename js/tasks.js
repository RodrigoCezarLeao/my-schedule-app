const user = localStorage.getItem("MyTask_user")
if (!user) window.location.href = "index.html"


const getUserDayTasks = async (date) => {
    query = `
        query MyQuery {
            tasks(where: {myUser: {identifyer: "${getCurrentUserIdentifyer()}"}, date: "${!date ? getCurrentDayStr() : date}"}) {
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
        let totalTS = 0
        if (historic) {
            for(let hist of historic){
                historicHTML += `
                <div>
                    <span>${hist.interval}</span>
                    <input type='text' value='${hist.description}' disabled />
                </div>
                `
                
                h1 = createDateFromTimeString(hist.interval.slice(0,8))
                h2 = createDateFromTimeString(hist.interval.slice(11,19))
                diff =  h1 - h2
                totalTS += diff
            }
        }

        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${title}</td>
            <td><button onclick='startTaskClock(this.parentElement.parentElement)' ${isButtonStartTaskEnabled() ? '' : 'disabled'}>Iniciar</button></td>
            <td>${historicHTML}</td>
            <td style="display: none">${task.id}</td>
            <td>${formatDateDiff(new Date(totalTS), false)}</td>
        `

        tbody.appendChild(tr)
    }
}

const addTaskInDB = async (title) => {
    const newDate = document.getElementById("input_date").value
    query = `
        mutation MyMutation {
            createTask(
                data: {date: "${newDate}", title: "${title}", myUser: {connect: {identifyer: "${getCurrentUserIdentifyer()}"}}}
            ) {
                id
            }
        }
    `

    const data = await baseDBRequest(query)
    const result = data?.data?.createTask?.id
    
    const result2 = await publishTask(result)

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
            <td><button onclick='startTaskClock(this.parentElement.parentElement)' ${thereIsAnyTaskRunning() || !isButtonStartTaskEnabled() ? 'disabled' : ''}>Iniciar</button></td>
            <td></td>
            <td style='display: none'>${taskid}</td>
            <td></td>
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
    document.getElementById("pause_button").disabled = false
}

const formatDateDiff = (date1, isCurrentTS = true) => {
    const currentTs = isCurrentTS ? new Date() : new Date(0)

    const startDate = `${date1.getHours().toString().padStart(2, "0")}:${date1.getMinutes().toString().padStart(2, "0")}:${date1.getSeconds().toString().padStart(2, "0")}`
    const finalDate = `${currentTs.getHours().toString().padStart(2, "0")}:${currentTs.getMinutes().toString().padStart(2, "0")}:${currentTs.getSeconds().toString().padStart(2, "0")}`

    const diffHours = new Date(currentTs - date1).getUTCHours()
    const diffMinutes = new Date(currentTs - date1).getUTCMinutes()
    const diffSeconds = new Date(currentTs - date1).getUTCSeconds()

    const diffHoursString = diffHours > 0 ? `${diffHours}h ` : ''
    const diffMinutesString = diffMinutes > 0 ? `${diffMinutes}min ` : ''
    const diffSecondsString = diffSeconds > 0 ? `${diffSeconds}s` : ''

    return isCurrentTS ? `${startDate} - ${finalDate} [${diffHoursString}${diffMinutesString}${diffSecondsString}]` : `${diffHoursString}${diffMinutesString}${diffSecondsString}`
}

const stopTaskClock = () => {
    clearInterval(refClock)
    refClock = undefined
}

const pauseTask = () => {
    stopTaskClock()
    modifyAllButtons(false)

    updateTaskInDB()

    refCurrentTaskElem.children[2].lastChild.children[1].disabled = true

    const historic = refCurrentTaskElem.children[2].children
    let totalTS = 0
    if (historic) {
        for(let hist of historic){
            
            h1 = createDateFromTimeString(hist.children[0].textContent.slice(0,8))
            h2 = createDateFromTimeString(hist.children[0].textContent.slice(11,19))
            diff =  h1 - h2
            totalTS += diff
        }
    }
    refCurrentTaskElem.children[4].textContent = formatDateDiff(new Date(totalTS), false)

    refCurrentTaskElem = undefined
    document.getElementById("pause_button").disabled = true
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

const removeQuotesFromKeys = (jsonString) => {
    return jsonString.replace(/"([^"]+)":/g, '$1:');
}

const updateTaskInDB = async () => {
    const taskHistoryId = refCurrentTaskElem.children[3].textContent;
    const historicList = []

    for (let hist of refCurrentTaskElem.children[2].children){
        const histDict = {}
        histDict.interval = hist.children[0].textContent
        histDict.description = hist.children[1].value
        historicList.push(histDict)
    }

    const jsonString = removeQuotesFromKeys(JSON.stringify(historicList, null, 2))
    query = `
        mutation MyMutation {
            updateTask(data: {historic: ${jsonString}}, where: {id: "${taskHistoryId}"})
            {
                id
            }
        }
    `
    

    const result = await baseDBRequest(query)
    const id = result?.data?.updateTask?.id
    const result2 = await publishTask(id)
    
    if (result2) alert("Tarefa pausada!")
}

const publishTask = async (id) => {
    query = `
        mutation MyMutation {
            publishTask(where: {id: "${id}"})
            {
                id
            }
        }
    `
    const data = await baseDBRequest(query)
    return data?.data?.publishTask?.id
}


const changeDate = () => {
    const newDate = document.getElementById("input_date").value
    document.getElementById("tbody").innerHTML = ""
    getUserDayTasks(newDate)
    document.getElementById("pause_button").disabled = !isButtonStartTaskEnabled()
}


const isButtonStartTaskEnabled = () => {
    const newDate = document.getElementById("input_date").value
    if (newDate === getCurrentDayStr())
        return true

    return false
}