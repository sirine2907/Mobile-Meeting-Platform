/**
 * App shell: hash router, in-memory state and toast notifications.
 * Routes:
 *   #/                 Homepage
 *   #/login            Login
 *   #/signup           Sign-up (basic account or complete profile)
 *   #/search           Search & results
 *   #/profile/:id      Public profile (":id" = "me" for your own)
 *   #/messages[/:id]   Inbox / conversation
 */
const App = (() => {
  const STORAGE_KEY = "meetly.messages.v1";

  const freshSignup = () => ({ mode: "complete", step: 1, data: { interests: [] } });

  function loadMessages() {
    try {
      return { ...SEED_MESSAGES, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return { ...SEED_MESSAGES };
    }
  }

  const state = {
    search: { city: CURRENT_USER.city, radius: 150, interests: [], sort: "distance" },
    signup: freshSignup(),
    favorites: new Set(["marc"]),
    messages: loadMessages(),
  };

  function saveMessages() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages)); } catch { /* private mode: keep in memory */ }
  }

  const routes = [
    [/^\/$/, () => HomeView()],
    [/^\/login$/, () => LoginView()],
    [/^\/signup$/, () => SignupView()],
    [/^\/search$/, () => SearchView()],
    [/^\/profile\/([\w-]+)$/, (id) => ProfileView(id)],
    [/^\/messages$/, () => InboxView()],
    [/^\/messages\/([\w-]+)$/, (id) => ChatView(id)],
  ];

  let lastPath = null;

  function render() {
    const path = location.hash.replace(/^#/, "") || "/";
    // Leaving the sign-up flow resets it.
    if (path !== "/signup" && lastPath === "/signup") state.signup = freshSignup();

    let view = null;
    for (const [re, fn] of routes) {
      const m = path.match(re);
      if (m) { view = fn(...m.slice(1)); break; }
    }
    view ||= HomeView();

    const root = document.getElementById("app");
    root.className = `app ${view.chat ? "is-chat" : ""} ${view.bare ? "is-bare" : ""}`;
    root.innerHTML = view.html;
    view.mount?.(root);
    if (path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
  }

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", render);

  return { state, render, toast, saveMessages, freshSignup };
})();
