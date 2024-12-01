async function getStoredSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["server", "port", "username", "password"], (settings) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Failed to read settings"));
      } else {
        console.log("Settings obtained from storage:", settings); 
        resolve(settings);
      }
    });
  });
}

async function login() {
  const { server, port, username, password } = await getStoredSettings();

  if (!server || !port || !username || !password) {
    throw new Error("Required settings are missing, please make sure all settings are filled in!");
  }

  const loginUrl = `${server}:${port}/api/v2/auth/login`;

  const response = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Login failed!，Status Code:${response.status}`);
  }

  return true;
}

async function addTorrent(link) {
  try {
    const { server, port } = await getStoredSettings();

    await login();

    const addTorrentUrl = `${server}:${port}/api/v2/torrents/add`;
    const formData = new FormData();
    formData.append("urls", link);

    const response = await fetch(addTorrentUrl, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`Task added failed!，Status Code:${response.status}`);
    }

    chrome.notifications.create("", {
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Task added success!",
      message: "The download task has been successfully added to the qBittorrent server"
    });
  } catch (error) {
    chrome.notifications.create("", {
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Task added failed!",
      message: error.message
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addTorrent",
    title: "Add qBittorrent download",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "addTorrent") {
    addTorrent(info.linkUrl);
  }
});
