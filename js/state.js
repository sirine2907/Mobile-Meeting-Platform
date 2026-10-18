// App state (kept in memory, messages and favorites are also saved in localStorage)
// TODO: replace with API calls when the backend is ready (milestone 1)

const MESSAGES_KEY = "meetly.messages";
const FAVORITES_KEY = "meetly.favorites";

function newSignupState() {
  return {
    mode: "complete", // "basic" or "complete"
    step: 1,
    data: { name: "", email: "", password: "", birth: "", terms: false, photo: "", city: "", intro: "", interests: [] },
  };
}

const appState = {
  search: {
    city: CURRENT_USER.city,
    radius: 150,
    interests: [],
    sort: "distance",
  },
  signup: newSignupState(),
  favorites: loadFromStorage(FAVORITES_KEY, ["marc"]),
  // saved conversations override the sample ones
  messages: Object.assign({}, SEED_MESSAGES, loadFromStorage(MESSAGES_KEY, {})),
};

function isFavorite(profileId) {
  return appState.favorites.includes(profileId);
}

function toggleFavorite(profileId) {
  if (isFavorite(profileId)) {
    appState.favorites = appState.favorites.filter(function (id) { return id !== profileId; });
  } else {
    appState.favorites.push(profileId);
  }
  saveToStorage(FAVORITES_KEY, appState.favorites);
  return isFavorite(profileId);
}

function addMessage(profileId, text) {
  if (!appState.messages[profileId]) {
    appState.messages[profileId] = [];
  }
  const message = { from: "me", text: text, at: currentTime() };
  appState.messages[profileId].push(message);
  saveToStorage(MESSAGES_KEY, appState.messages);
  return message;
}

function getPerson(id) {
  if (id === CURRENT_USER.id) return CURRENT_USER;
  return PROFILES.find(function (p) { return p.id === id; });
}
