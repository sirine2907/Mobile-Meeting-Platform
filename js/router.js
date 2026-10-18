// Simple hash router
//   #/                 homepage
//   #/login            login
//   #/signup           sign-up
//   #/search           search & results
//   #/profile/:id      public profile ("me" = my profile)
//   #/messages         inbox
//   #/messages/:id     conversation

const routes = [
  { path: /^\/$/, page: homePage },
  { path: /^\/login$/, page: loginPage },
  { path: /^\/signup$/, page: signupPage },
  { path: /^\/search$/, page: searchPage },
  { path: /^\/profile\/([\w-]+)$/, page: profilePage },
  { path: /^\/messages$/, page: inboxPage },
  { path: /^\/messages\/([\w-]+)$/, page: chatPage },
];

let previousPath = null;

function getCurrentPath() {
  const path = location.hash.replace("#", "");
  return path === "" ? "/" : path;
}

function renderPage() {
  const path = getCurrentPath();

  // reset the sign-up form when the user leaves it
  if (previousPath === "/signup" && path !== "/signup") {
    appState.signup = newSignupState();
  }

  let view = null;
  for (let i = 0; i < routes.length; i++) {
    const match = path.match(routes[i].path);
    if (match) {
      view = routes[i].page(match[1]);
      break;
    }
  }
  if (!view) view = homePage(); // unknown url

  closeAllDialogs();

  const app = document.getElementById("app");
  app.className = "app " + (view.className || "");
  app.innerHTML = view.html;
  if (view.setup) view.setup(app);

  if (path !== previousPath) window.scrollTo(0, 0);
  previousPath = path;
}

window.addEventListener("hashchange", renderPage);
document.addEventListener("DOMContentLoaded", renderPage);
