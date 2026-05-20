const state = {
  token: localStorage.getItem("streamflixToken"),
  user: null,
  catalog: [],
  featured: null,
  genres: [],
  isRegistering: false
};

const els = {
  featuredTitle: document.querySelector("#featuredTitle"),
  featuredDescription: document.querySelector("#featuredDescription"),
  featuredMeta: document.querySelector("#featuredMeta"),
  playFeaturedButton: document.querySelector("#playFeaturedButton"),
  saveFeaturedButton: document.querySelector("#saveFeaturedButton"),
  statsGrid: document.querySelector("#statsGrid"),
  accountName: document.querySelector("#accountName"),
  accountHint: document.querySelector("#accountHint"),
  catalogGrid: document.querySelector("#catalogGrid"),
  watchlistRow: document.querySelector("#watchlistRow"),
  progressList: document.querySelector("#progressList"),
  resultCount: document.querySelector("#resultCount"),
  watchlistStatus: document.querySelector("#watchlistStatus"),
  searchInput: document.querySelector("#searchInput"),
  genreSelect: document.querySelector("#genreSelect"),
  typeSelect: document.querySelector("#typeSelect"),
  openAuthButton: document.querySelector("#openAuthButton"),
  demoLoginButton: document.querySelector("#demoLoginButton"),
  profileButton: document.querySelector("#profileButton"),
  profileInitial: document.querySelector("#profileInitial"),
  authModal: document.querySelector("#authModal"),
  closeAuthButton: document.querySelector("#closeAuthButton"),
  authForm: document.querySelector("#authForm"),
  authTitle: document.querySelector("#authTitle"),
  authSubmitButton: document.querySelector("#authSubmitButton"),
  toggleAuthButton: document.querySelector("#toggleAuthButton"),
  nameField: document.querySelector("#nameField"),
  nameInput: document.querySelector("#nameInput"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  formMessage: document.querySelector("#formMessage"),
  toast: document.querySelector("#toast")
};

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2500);
}

function setUser(user, token = state.token) {
  state.user = user;
  state.token = token;
  if (token) {
    localStorage.setItem("streamflixToken", token);
  } else {
    localStorage.removeItem("streamflixToken");
  }
  renderAccount();
  renderCatalog();
  renderWatchlist();
  renderProgress();
}

function renderAccount() {
  if (!state.user) {
    els.accountName.textContent = "Guest mode";
    els.accountHint.textContent = "Use Demo login to test authenticated APIs instantly.";
    els.openAuthButton.textContent = "Sign in";
    els.demoLoginButton.classList.remove("hidden");
    els.profileButton.classList.add("hidden");
    return;
  }

  els.accountName.textContent = state.user.name;
  els.accountHint.textContent = `${state.user.plan} plan active. Watchlist and progress are synced.`;
  els.openAuthButton.textContent = "Sign out";
  els.demoLoginButton.classList.add("hidden");
  els.profileInitial.textContent = state.user.name.charAt(0).toUpperCase();
  els.profileButton.style.background = state.user.avatarColor || "#e50914";
  els.profileButton.classList.remove("hidden");
}

function renderStats(stats = []) {
  els.statsGrid.innerHTML = stats.map(item => `
    <div class="stat-card">
      <strong>${item.value}</strong>
      <span>${item.label}</span>
    </div>
  `).join("");
}

function renderFeatured() {
  if (!state.featured) return;

  els.featuredTitle.textContent = state.featured.title;
  els.featuredDescription.textContent = state.featured.description;
  els.featuredMeta.innerHTML = [
    `${state.featured.match}% Match`,
    state.featured.year,
    state.featured.rating,
    state.featured.type,
    `${state.featured.runtime} min`
  ].map(item => `<span>${item}</span>`).join("");
}

function titleCard(item, compact = false) {
  const isSaved = Boolean(state.user?.watchlist.includes(item.id));
  return `
    <article class="title-card" style="--poster-color: ${item.color}">
      <div class="poster-art">
        <strong>${item.title}</strong>
      </div>
      <div class="title-body">
        <div>
          <h3>${item.title}</h3>
          <div class="title-meta">
            <span>${item.match}% Match</span>
            <span>${item.type}</span>
            <span>${item.year}</span>
          </div>
        </div>
        ${compact ? "" : `<p>${item.description}</p>`}
        <div class="card-actions">
          <button class="primary-button" data-action="play" data-id="${item.id}" type="button">Play</button>
          <button class="secondary-button" data-action="save" data-id="${item.id}" type="button">${isSaved ? "Saved" : "My list"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderCatalog() {
  els.resultCount.textContent = `${state.catalog.length} ${state.catalog.length === 1 ? "title" : "titles"}`;
  if (!state.catalog.length) {
    els.catalogGrid.innerHTML = `<p class="empty-state">No titles match these filters.</p>`;
    return;
  }
  els.catalogGrid.innerHTML = state.catalog.map(item => titleCard(item)).join("");
}

function renderWatchlist() {
  if (!state.user) {
    els.watchlistStatus.textContent = "Sign in to sync";
    els.watchlistRow.innerHTML = `<p class="empty-state">Your saved movies and series will appear here after login.</p>`;
    return;
  }

  const titles = state.catalog.filter(item => state.user.watchlist.includes(item.id));
  els.watchlistStatus.textContent = `${titles.length} saved`;
  els.watchlistRow.innerHTML = titles.length
    ? titles.map(item => titleCard(item, true)).join("")
    : `<p class="empty-state">Your watchlist is empty. Save a title from the catalog.</p>`;
}

function renderProgress() {
  if (!state.user) {
    els.progressList.innerHTML = `<p class="empty-state">Sign in to track watching progress.</p>`;
    return;
  }

  const rows = state.user.continueWatching
    .map(item => {
      const title = state.catalog.find(catalogItem => catalogItem.id === item.titleId);
      return title ? { ...item, title } : null;
    })
    .filter(Boolean);

  els.progressList.innerHTML = rows.length ? rows.map(item => `
    <article class="progress-item">
      <div>
        <strong>${item.title.title}</strong>
        <div class="progress-bar" style="--progress: ${item.progress}%"><span></span></div>
      </div>
      <span>${item.progress}% watched</span>
    </article>
  `).join("") : `<p class="empty-state">Start playing a title to create progress data.</p>`;
}

async function loadCatalog() {
  const params = new URLSearchParams({
    search: els.searchInput.value,
    genre: els.genreSelect.value,
    type: els.typeSelect.value
  });
  const { catalog } = await api(`/api/catalog?${params}`);
  state.catalog = catalog;
  renderCatalog();
  renderWatchlist();
  renderProgress();
}

async function hydrate() {
  const [{ featured }, { genres }, { stats }] = await Promise.all([
    api("/api/featured"),
    api("/api/genres"),
    api("/api/stats")
  ]);

  state.featured = featured;
  state.genres = genres;
  els.genreSelect.innerHTML = `<option value="all">All genres</option>` +
    genres.map(genre => `<option value="${genre}">${genre}</option>`).join("");
  renderFeatured();
  renderStats(stats);

  if (state.token) {
    try {
      const { user } = await api("/api/me");
      setUser(user);
    } catch (error) {
      setUser(null, null);
    }
  } else {
    renderAccount();
  }

  await loadCatalog();
}

async function login(email, password) {
  const { token, user } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setUser(user, token);
  els.authModal.close();
  showToast(`Welcome back, ${user.name}`);
}

async function register(name, email, password) {
  const { token, user } = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });
  setUser(user, token);
  els.authModal.close();
  showToast("Account created successfully");
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    setUser(null, null);
    showToast("Signed out");
  }
}

async function toggleWatchlist(id) {
  if (!state.user) {
    els.authModal.showModal();
    showToast("Sign in to save titles");
    return;
  }

  const saved = state.user.watchlist.includes(id);
  const { user } = await api(`/api/watchlist/${id}`, { method: saved ? "DELETE" : "POST" });
  setUser(user);
  showToast(saved ? "Removed from watchlist" : "Saved to watchlist");
}

async function playTitle(id) {
  const title = state.catalog.find(item => item.id === id) || state.featured;
  if (!title) return;

  if (state.user) {
    const progress = Math.floor(12 + Math.random() * 70);
    const { user } = await api(`/api/progress/${title.id}`, {
      method: "POST",
      body: JSON.stringify({ progress })
    });
    setUser(user);
  }

  showToast(`Playing preview: ${title.title}`);
}

function updateAuthMode() {
  els.authTitle.textContent = state.isRegistering ? "Create account" : "Sign in";
  els.authSubmitButton.textContent = state.isRegistering ? "Create account" : "Sign in";
  els.toggleAuthButton.textContent = state.isRegistering ? "Already have an account?" : "Create a new account";
  els.nameField.classList.toggle("hidden", !state.isRegistering);
  els.formMessage.textContent = "";
}

els.openAuthButton.addEventListener("click", () => {
  if (state.user) {
    logout();
    return;
  }
  state.isRegistering = false;
  updateAuthMode();
  els.authModal.showModal();
});

els.demoLoginButton.addEventListener("click", () => {
  login("demo@streamflix.com", "password123").catch(error => showToast(error.message));
});

els.closeAuthButton.addEventListener("click", () => els.authModal.close());

els.toggleAuthButton.addEventListener("click", () => {
  state.isRegistering = !state.isRegistering;
  updateAuthMode();
});

els.authForm.addEventListener("submit", event => {
  event.preventDefault();
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;
  const action = state.isRegistering
    ? register(els.nameInput.value.trim(), email, password)
    : login(email, password);

  action.catch(error => {
    els.formMessage.textContent = error.message;
  });
});

els.catalogGrid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "save") toggleWatchlist(button.dataset.id);
  if (button.dataset.action === "play") playTitle(button.dataset.id);
});

els.watchlistRow.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "save") toggleWatchlist(button.dataset.id);
  if (button.dataset.action === "play") playTitle(button.dataset.id);
});

els.playFeaturedButton.addEventListener("click", () => {
  if (state.featured) playTitle(state.featured.id);
});

els.saveFeaturedButton.addEventListener("click", () => {
  if (state.featured) toggleWatchlist(state.featured.id);
});

[els.searchInput, els.genreSelect, els.typeSelect].forEach(element => {
  element.addEventListener("input", () => {
    window.clearTimeout(element.searchTimer);
    element.searchTimer = window.setTimeout(() => {
      loadCatalog().catch(error => showToast(error.message));
    }, 180);
  });
});

hydrate().catch(error => {
  showToast(error.message);
});
