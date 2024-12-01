document.addEventListener("DOMContentLoaded", async () => {
  const serverInput = document.getElementById("server");
  const portInput = document.getElementById("port");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const testButton = document.getElementById("testConnection");
  const statusDiv = document.getElementById("connectionStatus");

  chrome.storage.sync.get(["server", "port", "username", "password"], (items) => {
    serverInput.value = items.server || "http://"; 
    portInput.value = items.port || "8080"; 
    usernameInput.value = items.username || "";
    passwordInput.value = items.password || "";
  });

  document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    
    const server = serverInput.value.trim();
    const port = portInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    chrome.storage.sync.set({ server, port, username, password }, () => {
      console.log("Saved:", { server, port, username, password }); 
      alert("Saved");
    });
  });

  testButton.addEventListener("click", async () => {
    let server = serverInput.value.trim();
    const port = portInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!server || !port || !username || !password) {
      statusDiv.textContent = "Please check your input!";
      statusDiv.style.color = "red";
      return;
    }

    const url = `${server}:${port}/api/v2/auth/login`;

try {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded"},
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  });

  // 检查响应状态
  if (response.ok) {
    statusDiv.textContent = "Success: Connected to server successfully!";
    statusDiv.style.color = "green";
  } else {
    const errorText = await response.text(); 
    console.error("Error Details:", response.status, errorText);

    switch (response.status) {
      case 400:
        statusDiv.textContent = "Bad Request: Please verify the request format!";
        break;
      case 401:
        statusDiv.textContent = "Authentication failed: Invalid username or password.";
        break;
      case 403:
        statusDiv.textContent = "Forbidden: You don't have permission to access.";
        break;
      case 404:
        statusDiv.textContent = "Not Found: The server endpoint was not found.";
        break;
      case 500:
        statusDiv.textContent = "Internal Server Error: Please try again later.";
        break;
      default:
        statusDiv.textContent = `Unexpected Error: HTTP ${response.status}`;
    }

    statusDiv.style.color = "red";
  }
} catch (error) {
  console.error("Connection Error:", error.message);

  if (error.name === "TypeError") {
    statusDiv.textContent = "Network Error: Unable to reach the server.";
  } else {
    statusDiv.textContent = `Unexpected Error: ${error.message}`;
  }

  statusDiv.style.color = "red";
}

  });
});
