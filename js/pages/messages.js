// Messages: inbox (#/messages) and conversation (#/messages/:id)
// Messages are saved in localStorage for the demo, milestone 3 moves them to the server

function inboxPage() {
  const conversations = [];
  Object.keys(appState.messages).forEach(function (id) {
    const person = getPerson(id);
    const messages = appState.messages[id];
    if (person && messages.length > 0) {
      conversations.push({ person: person, last: messages[messages.length - 1] });
    }
  });

  let content;
  if (conversations.length === 0) {
    content = `
      <div class="empty">
        ${icon("chat", "icon-lg")}
        <h2>No conversations yet</h2>
        <p>Find someone who shares your interests and say hello.</p>
        <a class="btn btn-primary" href="#/search">Discover people</a>
      </div>`;
  } else {
    content = `<ul class="inbox">`;
    conversations.forEach(function (c) {
      const prefix = c.last.from === "me" ? "You: " : "";
      content += `
        <li><a href="#/messages/${c.person.id}">
          <div class="result-photo sm">
            <img src="${c.person.photo}" alt="" />
            ${c.person.online ? '<span class="online-dot"></span>' : ""}
          </div>
          <div class="inbox-body">
            <div class="row-between"><strong>${escapeHtml(c.person.name)}</strong><small class="muted">${escapeHtml(c.last.at)}</small></div>
            <p class="clamp-1 muted">${prefix}${escapeHtml(c.last.text)}</p>
          </div>
        </a></li>`;
    });
    content += `</ul>`;
  }

  const html = `
    <header class="topbar"><h1 class="topbar-title left">Messages</h1></header>
    <main class="page">${content}</main>
    ${bottomNav("Messages")}`;

  return { html: html };
}

function messageBubble(message) {
  const side = message.from === "me" ? "me" : "them";
  return `<div class="bubble ${side}">${escapeHtml(message.text)}<time>${escapeHtml(message.at)}</time></div>`;
}

function chatPage(id) {
  const person = getPerson(id);
  // can't chat with yourself or with an unknown profile
  if (!person || person.id === CURRENT_USER.id) {
    return inboxPage();
  }

  const messages = appState.messages[id] || [];
  let bubbles = "";
  messages.forEach(function (m) {
    bubbles += messageBubble(m);
  });

  const html = `
    <header class="topbar chat-top">
      <a class="icon-btn" href="#/messages" aria-label="Back">${icon("back")}</a>
      <a class="chat-who" href="#/profile/${person.id}">
        <div class="result-photo xs">
          <img src="${person.photo}" alt="" />
          ${person.online ? '<span class="online-dot"></span>' : ""}
        </div>
        <div><strong>${escapeHtml(person.name)}</strong><small class="muted">${person.online ? "Online" : "Offline"}</small></div>
      </a>
      <span class="icon-btn-spacer"></span>
    </header>

    <main class="chat" id="thread">
      <p class="chat-note">${icon("shield")} Only you and ${escapeHtml(person.name)} can see this conversation.</p>
      ${bubbles}
    </main>

    <form class="composer" id="composer">
      <input id="msg" placeholder="Write a message…" autocomplete="off" maxlength="1000" aria-label="Message" />
      <button class="icon-btn send" aria-label="Send">${icon("send")}</button>
    </form>`;

  function setup(page) {
    const thread = page.querySelector("#thread");
    const input = page.querySelector("#msg");
    thread.scrollTop = thread.scrollHeight;

    page.querySelector("#composer").addEventListener("submit", function (e) {
      e.preventDefault();
      const text = input.value.trim();
      if (text === "") return;

      const message = addMessage(id, text);
      thread.insertAdjacentHTML("beforeend", messageBubble(message));
      input.value = "";
      thread.scrollTop = thread.scrollHeight;
    });
  }

  return { html: html, setup: setup, className: "chat-layout" };
}
