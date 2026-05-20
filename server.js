const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".m4v": "video/x-m4v",
  ".mp4": "video/mp4"
};

function readDatabase() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDatabase(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

function getSessionUser(req, db) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const session = db.sessions.find(item => item.token === token);
  if (!session) return null;
  return db.users.find(user => user.id === session.userId) || null;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    avatarColor: user.avatarColor,
    watchlist: user.watchlist,
    continueWatching: user.continueWatching
  };
}

function filterCatalog(catalog, query) {
  const search = (query.search || "").toLowerCase();
  const genre = (query.genre || "all").toLowerCase();
  const type = (query.type || "all").toLowerCase();

  return catalog.filter(item => {
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.cast.join(" ").toLowerCase().includes(search);
    const matchesGenre = genre === "all" || item.genres.map(g => g.toLowerCase()).includes(genre);
    const matchesType = type === "all" || item.type.toLowerCase() === type;
    return matchesSearch && matchesGenre && matchesType;
  });
}

function serveStatic(req, res) {
  const rawPath = decodeURIComponent(req.url.split("?")[0]);
  const requestPath = rawPath === "/" ? "/index.html" : rawPath;
  const filePath = path.resolve(PUBLIC_DIR, "." + requestPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(path.join(PUBLIC_DIR, "index.html")));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleApi(req, res, url) {
  const db = readDatabase();

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { status: "ok", app: "StreamFlix API" });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = db.users.find(item => item.email === email && item.password === password);
    if (!user) return sendError(res, 401, "Invalid email or password");

    const token = createToken();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    writeDatabase(db);
    return sendJson(res, 200, { token, user: sanitizeUser(user) });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    const body = await parseBody(req);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (name.length < 2) return sendError(res, 400, "Name must be at least 2 characters");
    if (!email.includes("@")) return sendError(res, 400, "Enter a valid email address");
    if (password.length < 6) return sendError(res, 400, "Password must be at least 6 characters");
    if (db.users.some(user => user.email === email)) return sendError(res, 409, "Account already exists");

    const user = {
      id: "u" + Date.now(),
      name,
      email,
      password,
      plan: "Mobile",
      avatarColor: "#e50914",
      watchlist: [],
      continueWatching: []
    };
    const token = createToken();
    db.users.push(user);
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    writeDatabase(db);
    return sendJson(res, 201, { token, user: sanitizeUser(user) });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    db.sessions = db.sessions.filter(session => session.token !== token);
    writeDatabase(db);
    return sendJson(res, 200, { success: true });
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = getSessionUser(req, db);
    if (!user) return sendError(res, 401, "Please sign in");
    return sendJson(res, 200, { user: sanitizeUser(user) });
  }

  if (req.method === "GET" && url.pathname === "/api/catalog") {
    const catalog = filterCatalog(db.catalog, Object.fromEntries(url.searchParams));
    return sendJson(res, 200, { catalog });
  }

  if (req.method === "GET" && url.pathname === "/api/featured") {
    const featured = db.catalog.find(item => item.featured) || db.catalog[0];
    return sendJson(res, 200, { featured });
  }

  if (req.method === "GET" && url.pathname === "/api/genres") {
    const genres = [...new Set(db.catalog.flatMap(item => item.genres))].sort();
    return sendJson(res, 200, { genres });
  }

  if (req.method === "GET" && url.pathname === "/api/stats") {
    const movieCount = db.catalog.filter(item => item.type === "Movie").length;
    const seriesCount = db.catalog.filter(item => item.type === "Series").length;
    const minutes = db.catalog.reduce((total, item) => total + item.runtime, 0);
    return sendJson(res, 200, {
      stats: [
        { label: "Titles", value: db.catalog.length },
        { label: "Movies", value: movieCount },
        { label: "Series", value: seriesCount },
        { label: "Hours", value: Math.round(minutes / 60) }
      ]
    });
  }

  const watchlistMatch = url.pathname.match(/^\/api\/watchlist\/([^/]+)$/);
  if (watchlistMatch && req.method === "POST") {
    const user = getSessionUser(req, db);
    if (!user) return sendError(res, 401, "Please sign in to save titles");
    const titleId = watchlistMatch[1];
    if (!db.catalog.some(item => item.id === titleId)) return sendError(res, 404, "Title not found");
    if (!user.watchlist.includes(titleId)) user.watchlist.push(titleId);
    writeDatabase(db);
    return sendJson(res, 200, { user: sanitizeUser(user) });
  }

  if (watchlistMatch && req.method === "DELETE") {
    const user = getSessionUser(req, db);
    if (!user) return sendError(res, 401, "Please sign in");
    user.watchlist = user.watchlist.filter(id => id !== watchlistMatch[1]);
    writeDatabase(db);
    return sendJson(res, 200, { user: sanitizeUser(user) });
  }

  if (req.method === "GET" && url.pathname === "/api/watchlist") {
    const user = getSessionUser(req, db);
    if (!user) return sendError(res, 401, "Please sign in");
    const titles = db.catalog.filter(item => user.watchlist.includes(item.id));
    return sendJson(res, 200, { catalog: titles });
  }

  const progressMatch = url.pathname.match(/^\/api\/progress\/([^/]+)$/);
  if (progressMatch && req.method === "POST") {
    const user = getSessionUser(req, db);
    if (!user) return sendError(res, 401, "Please sign in");
    const body = await parseBody(req);
    const progress = Math.max(0, Math.min(100, Number(body.progress || 0)));
    const current = user.continueWatching.find(item => item.titleId === progressMatch[1]);
    if (current) {
      current.progress = progress;
      current.updatedAt = new Date().toISOString();
    } else {
      user.continueWatching.unshift({
        titleId: progressMatch[1],
        progress,
        updatedAt: new Date().toISOString()
      });
    }
    writeDatabase(db);
    return sendJson(res, 200, { user: sanitizeUser(user) });
  }

  sendError(res, 404, "API route not found");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res);
    }
  } catch (error) {
    sendError(res, 500, error.message || "Server error");
  }
});

server.listen(PORT, () => {
  console.log(`StreamFlix running at http://127.0.0.1:${PORT}`);
});
