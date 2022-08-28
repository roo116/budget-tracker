let db;
const request = indexedDB.open("budget", 1);
console.log('>>> this is request ', request)

request.onupgradeneeded = (event) => {
  console.log(">>>> event ", event)
  const db = event.target.result;
  db.createObjectStore("new_budget", { autoIncrement: true });
  console.log("ryan - db", db)
};

request.onsuccess = function (event) {
  // when db creation is successful, save reference to db in a global variable
  db = event.target.result;
  console.log('>>> this is db ', db)

  // if app online, send all data to API
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  // log error
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_budget"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget");

  // add record to local obj store
  budgetObjectStore.add(record);
}

function uploadBudget() {
  // open transactiont to db
  const transaction = db.transaction(["new_budget"], "readwrite");
  console.log(">>> uploadbudget transaction = ", transaction);
  const budgetObjectStore = transaction.objectStore("new_budget");
  const getAll = budgetObjectStore.getAll();

  // on success
  getAll.onsuccess = function () {
    // if data in localstore send to API
    if (getAll.result.length > 0) {
      console.log("get.All.result ", getAll.result);
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["new_budget"], "readwrite");
          const budgetObjectStore = transaction.objectStore("new_budget");
          // clear
          budgetObjectStore.clear();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// check if online
window.addEventListener("online", uploadBudget);
