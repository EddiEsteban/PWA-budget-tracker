const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB

let db
const request = indexedDB.open("budget", 1)

request.onupgradeneeded = (evt) => {
    db = evt.target.result
    db.createObjectStore("pending", { autoIncrement: true })
}

request.onsuccess = (evt) => {
    db = evt.target.result

    // check if app is online before reading from db
    if (navigator.onLine) {
        checkDB()
    }
}

request.onerror = (evt) => {
    console.log("Error: ", evt.target.errorCode)
}

const saveRecord = (record) => {
    const tx = db.transaction(["pending"], "readwrite")
    const store = tx.objectStore("pending")

    store.add(record)
}

const checkDB = () => {
    let tx = db.transaction(["pending"], "readwrite")
    let store = tx.objectStore("pending")
    let getAll = store.getAll()

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                },
            })
                .then((res) => {
                    return res.json()
                })
                .then(() => {
                    // delete records if successful
                    const tx = db.transaction(["pending"], "readwrite")
                    const store = tx.objectStore("pending")
                    const getAll = store.getAll()
                    store.clear()
                })
        }
    }
}

// listen for app coming back online
window.addEventListener("online", checkDB)
