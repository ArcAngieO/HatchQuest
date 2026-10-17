// Electron wrapper: lets HatchQuest run as a desktop app (.exe on Windows).
// Progress is saved in this computer's app data folder, separate for each Windows user.
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 640,
    backgroundColor: "#1d1838", autoHideMenuBar: true, title: "HatchQuest",
    webPreferences: { contextIsolation: true },
  });
  win.loadFile(path.join(__dirname, "index.html"));
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
