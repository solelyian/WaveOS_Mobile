// electron/main.cjs — hôte Windows du prototype WaveOS.
// Sert la dist Vite via un schéma "app://waveos/" : les chemins absolus
// (/img/…, /assets/…, /waveos.wasm) fonctionnent comme en HTTP, contrairement
// à file:// où les modules ES et les chemins racine échouent.
const { app, BrowserWindow, protocol, net } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function createWindow() {
  const dist = path.join(__dirname, "..", "dist");

  protocol.handle("app", (req) => {
    const { pathname } = new URL(req.url);
    let rel = decodeURIComponent(pathname);
    if (rel === "/" || rel.endsWith("/")) rel += "index.html";
    const file = path.join(dist, rel);
    const res = net
      .fetch(pathToFileURL(file).toString())
      .catch(() => new Response("Not found", { status: 404 }));
    const mime = MIME[path.extname(file).toLowerCase()];
    if (!mime) return res;
    return res.then((r) => {
      const h = new Headers(r.headers);
      h.set("content-type", mime);
      return new Response(r.body, { status: r.status, headers: h });
    });
  });

  // fenêtre transparente sans cadre : on ne voit que le corps du téléphone.
  // 428×878 = phone 400×850 + le ring bezel (box-shadow 14px de chaque côté).
  const win = new BrowserWindow({
    width: 428,
    height: 878,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    minWidth: 320,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    title: "WaveOS",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.loadURL("app://waveos/index.html");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
