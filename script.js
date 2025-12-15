// =========================
// State & helpers
// =========================

const defaultAvatars = {
  alex: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200",
  elly: "https://images.pexels.com/photos/3760853/pexels-photo-3760853.jpeg?auto=compress&cs=tinysrgb&w=200",
  office: "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=200",
  friend: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200",
  notes: "https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=200"
};

let currentContactId = "alex";

let conversations = {
  alex: [],
  elly: [],
  office: [],
  friend: [],
  notes: []
};

let contactSettings = {
  alex: { name: "Alex", avatar: defaultAvatars.alex },
  elly: { name: "Elly", avatar: defaultAvatars.elly },
  office: { name: "Office", avatar: defaultAvatars.office },
  friend: { name: "Friend", avatar: defaultAvatars.friend },
  notes: { name: "Notes", avatar: defaultAvatars.notes }
};

const LS_KEY_CONVOS = "mona_chat_conversations_v3";
const LS_KEY_CONTACTS = "mona_chat_contacts_v3";
const LS_KEY_THEME = "mona_chat_theme_v1";

function saveState() {
  localStorage.setItem(LS_KEY_CONVOS, JSON.stringify(conversations));
  localStorage.setItem(LS_KEY_CONTACTS, JSON.stringify(contactSettings));
}

function loadState() {
  try {
    const convosStr = localStorage.getItem(LS_KEY_CONVOS);
    const contactsStr = localStorage.getItem(LS_KEY_CONTACTS);
    if (convosStr) {
      const parsed = JSON.parse(convosStr);
      conversations = { ...conversations, ...parsed };
    }
    if (contactsStr) {
      const parsed = JSON.parse(contactsStr);
      contactSettings = { ...contactSettings, ...parsed };
    }
  } catch (e) {
    console.warn("loadState error", e);
  }
}

function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const hh = h % 12 || 12;
  const mm = m.toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hh}:${mm} ${ampm}`;
}

function formatDateLabel(date) {
  const today = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (t - d) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

loadState();

// =========================
// DOM refs
// =========================

const body = document.body;
const contactsEls = document.querySelectorAll(".contact");
const chatBodyEl = document.getElementById("chat-body");
const chatNameEl = document.getElementById("chat-name");
const chatAvatarEl = document.getElementById("chat-avatar");
const chatStatusEl = document.getElementById("chat-status");
const typingIndicatorEl = document.getElementById("typing-indicator");
const typingTextEl = document.getElementById("typing-text");
const messageInputEl = document.getElementById("message-input");
const sendBtnEl = document.getElementById("send-btn");
const backBtnEl = document.getElementById("back-btn");
const attachBtnEl = document.getElementById("attach-btn");
const imageInputEl = document.getElementById("image-input");

const alexPreviewEl = document.getElementById("alex-preview");
const ellyPreviewEl = document.getElementById("elly-preview");
const officePreviewEl = document.getElementById("office-preview");
const friendPreviewEl = document.getElementById("friend-preview");
const notesPreviewEl = document.getElementById("notes-preview");

const alexAvatarEl = document.getElementById("alex-avatar");
const ellyAvatarEl = document.getElementById("elly-avatar");
const officeAvatarEl = document.getElementById("office-avatar");
const friendAvatarEl = document.getElementById("friend-avatar");
const notesAvatarEl = document.getElementById("notes-avatar");

// Modal
const profileModalEl = document.getElementById("profile-modal");
const profileModalCloseEl = document.getElementById("profile-modal-close");
const modalAvatarEl = document.getElementById("modal-avatar");
const modalAboutEl = document.getElementById("modal-about");
const avatarInputEl = document.getElementById("avatar-input");
const editProfileBtnEl = document.getElementById("edit-profile-btn");

// Rename popup
const renamePopupEl = document.getElementById("rename-popup");
const renameInputEl = document.getElementById("rename-input");
const renameSaveBtnEl = document.getElementById("rename-save-btn");
const renameCancelBtnEl = document.getElementById("rename-cancel-btn");
let renameTargetId = null;

// Theme buttons
const themeBtns = document.querySelectorAll(".theme-btn");

// Toast
const toastEl = document.getElementById("toast");

// =========================
// Theme
// =========================

function applyTheme(theme) {
  body.classList.remove("light-theme", "dark-theme");
  themeBtns.forEach(btn => btn.classList.remove("active"));

  if (theme === "light") body.classList.add("light-theme");
  else if (theme === "dark") body.classList.add("dark-theme");

  const btn = document.querySelector(`.theme-btn[data-theme="${theme}"]`);
  if (btn) btn.classList.add("active");

  localStorage.setItem(LS_KEY_THEME, theme);
}

function initTheme() {
  const saved = localStorage.getItem(LS_KEY_THEME) || "cute";
  applyTheme(saved);
}

themeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const t = btn.getAttribute("data-theme");
    applyTheme(t);
  });
});

initTheme();

// =========================
// Toast
// =========================

let toastTimeout = null;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("visible");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("visible");
  }, 2000);
}

// =========================
// Contacts render
// =========================

function renderContacts() {
  alexAvatarEl.src = contactSettings.alex.avatar || defaultAvatars.alex;
  ellyAvatarEl.src = contactSettings.elly.avatar || defaultAvatars.elly;
  officeAvatarEl.src = contactSettings.office.avatar || defaultAvatars.office;
  friendAvatarEl.src = contactSettings.friend.avatar || defaultAvatars.friend;
  notesAvatarEl.src = contactSettings.notes.avatar || defaultAvatars.notes;

  document.querySelectorAll(".contact-name").forEach(el => {
    const id = el.getAttribute("data-contact-name");
    el.textContent = contactSettings[id].name || id;
  });

  function setPreview(id, el) {
    const msgs = conversations[id] || [];
    if (msgs.length === 0) {
      if (id === "alex") el.textContent = "Tap to chat with Alex";
      else if (id === "elly") el.textContent = "Tap to chat with Elly";
      else el.textContent = "Tap to chat";
      return;
    }
    const last = msgs[msgs.length - 1];
    const prefix = last.role === "user" ? "You: " : "";
    if (last.type === "image") el.textContent = prefix + "[Image]";
    else el.textContent = prefix + last.content.slice(0, 40);
  }

  setPreview("alex", alexPreviewEl);
  setPreview("elly", ellyPreviewEl);
  setPreview("office", officePreviewEl);
  setPreview("friend", friendPreviewEl);
  setPreview("notes", notesPreviewEl);
}

// =========================
// Chat render
// =========================

function renderChat(contactId) {
  chatBodyEl.innerHTML = "";
  const msgs = conversations[contactId] || [];
  let lastDateKey = null;

  msgs.forEach((msg, idx) => {
    const msgDate = msg._dateObj ? new Date(msg._dateObj) : new Date();
    const dKey = msg.dateStr || getDateKey(msgDate);

    if (dKey !== lastDateKey) {
      const dateRow = document.createElement("div");
      dateRow.classList.add("date-separator");
      const badge = document.createElement("span");
      badge.classList.add("date-badge");
      badge.textContent = formatDateLabel(msgDate);
      dateRow.appendChild(badge);
      chatBodyEl.appendChild(dateRow);
      lastDateKey = dKey;
    }

    const row = document.createElement("div");
    row.classList.add("message-row", msg.role === "user" ? "me" : "them");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    const prev = msgs[idx - 1];
    const next = msgs[idx + 1];
    const isStart = !prev || prev.role !== msg.role || prev.dateStr !== msg.dateStr;
    const isEnd = !next || next.role !== msg.role || next.dateStr !== msg.dateStr;

    if (isStart) bubble.classList.add("group-start");
    if (isEnd) bubble.classList.add("group-end");

    if (msg.type === "image") {
      const img = document.createElement("img");
      img.src = msg.imageData;
      img.alt = "Image";
      img.classList.add("message-image");
      bubble.appendChild(img);
      if (msg.content) {
        const caption = document.createElement("div");
        caption.textContent = msg.content;
        bubble.appendChild(caption);
      }
    } else {
      bubble.textContent = msg.content;
    }

    const meta = document.createElement("div");
    meta.classList.add("message-meta");
    const timeSpan = document.createElement("span");
    timeSpan.textContent = msg.time || "";
    meta.appendChild(timeSpan);

    if (msg.role === "user") {
      const statusSpan = document.createElement("span");
      statusSpan.classList.add("status-indicator");
      if (msg.status === "read") statusSpan.textContent = "✓✓ Read";
      else if (msg.status === "delivered") statusSpan.textContent = "✓✓ Delivered";
      else statusSpan.textContent = "✓ Sent";
      meta.appendChild(statusSpan);
    }

    bubble.appendChild(meta);
    row.appendChild(bubble);
    chatBodyEl.appendChild(row);
  });

  chatBodyEl.scrollTop = chatBodyEl.scrollHeight;
}

// =========================
// Typing indicator + header status
// =========================

function showTyping(name) {
  typingTextEl.textContent = `${name} is typing...`;
  typingIndicatorEl.classList.add("visible");
  chatStatusEl.textContent = "Typing…";
}

function restoreStatus(contactId) {
  if (contactId === "alex") chatStatusEl.textContent = "Online";
  else if (contactId === "elly") chatStatusEl.textContent = Math.random() > 0.5 ? "Online" : "Last seen recently";
  else chatStatusEl.textContent = "Last seen " + formatTime(new Date());
}

function hideTyping(contactId) {
  typingIndicatorEl.classList.remove("visible");
  restoreStatus(contactId);
}

// =========================
// Backend-based replies (Cloudflare Worker + OpenRouter)
// =========================

const BACKEND_URL = "https://noisy-haze-453b.crinkle-crease-official.workers.dev";

async function getMockReply(contactId, userText) {
  try {
    const res = await fetch(BACKEND_URL + "/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, userText })
    });

    if (!res.ok) {
      console.error("Backend error status:", res.status);
      return "Sorry, something went wrong on the server.";
    }

    const data = await res.json();
    return data.replyText || "I’m here, talk to you.";
  } catch (err) {
    console.error("Error calling backend:", err);
    return "I couldn’t reach the server, but I’m still here.";
  }
}

function mockSendMessage(contactId, userText) {
  const delay = 800 + Math.floor(Math.random() * 1200);
  return new Promise(resolve => {
    setTimeout(async () => {
      const replyText = await getMockReply(contactId, userText);
      resolve(replyText);
    }, delay);
  });
}

// =========================
// Sending messages (text + images)
// =========================

async function sendMessage({ text, imageData }) {
  if (!text && !imageData) return;

  const now = new Date();
  const timeStr = formatTime(now);
  const dateKey = getDateKey(now);

  conversations[currentContactId] = conversations[currentContactId] || [];

  const userMsg = {
    role: "user",
    content: text || "",
    time: timeStr,
    dateStr: dateKey,
    status: "sent",
    type: imageData ? "image" : "text",
    imageData: imageData || null,
    _dateObj: now.toISOString()
  };

  conversations[currentContactId].push(userMsg);
  renderChat(currentContactId);
  renderContacts();
  saveState();
  messageInputEl.value = "";
  chatBodyEl.scrollTop = chatBodyEl.scrollHeight;

  const name = contactSettings[currentContactId].name;
  showTyping(name);

  const msgs = conversations[currentContactId];
  const lastUser = msgs.filter(m => m.role === "user").slice(-1)[0];
  if (lastUser) lastUser.status = "delivered";
  renderChat(currentContactId);
  saveState();

  const replyText = await mockSendMessage(currentContactId, text || "[image]");

  hideTyping(currentContactId);

  const msgsAfter = conversations[currentContactId];
  const lastUserAfter = msgsAfter.filter(m => m.role === "user").slice(-1)[0];
  if (lastUserAfter) lastUserAfter.status = "read";

  const replyTime = formatTime(new Date());
  const replyMsg = {
    role: "assistant",
    content: replyText,
    time: replyTime,
    dateStr: dateKey,
    type: "text",
    _dateObj: new Date().toISOString()
  };
  conversations[currentContactId].push(replyMsg);
  renderChat(currentContactId);
  renderContacts();
  saveState();
}

async function handleSend() {
  const text = messageInputEl.value.trim();
  await sendMessage({ text, imageData: null });
}

sendBtnEl.addEventListener("click", handleSend);
messageInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

attachBtnEl.addEventListener("click", () => {
  imageInputEl.click();
});

imageInputEl.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(evt) {
    const dataUrl = evt.target.result;
    await sendMessage({ text: messageInputEl.value.trim(), imageData: dataUrl });
  };
  reader.readAsDataURL(file);
});

// =========================
// Profile modal
// =========================

let modalContactId = "alex";

function getContactAbout(id) {
  if (id === "alex") {
    return `
<strong>About Alex</strong><br>
British businessman, travels a lot for work. Met Mona in India on a business trip and has been in a relationship with her for over 2 years. Very in love, a bit possessive and clingy, gets jealous easily but adores her. Calls her “love”, “babe”, and “sweetheart”.
`;
  }
  if (id === "elly") {
    return `
<strong>About Elly</strong><br>
American best friend, living in Australia with her boyfriend Leon. She has known Mona for around 10 years, knows all her drama with Alex, and talks in a casual, outspoken, and supportive way.
`;
  }
  if (id === "office") {
    return `
<strong>About Office</strong><br>
A placeholder contact for work or projects. You can rename and customize this contact.
`;
  }
  if (id === "friend") {
    return `
<strong>About Friend</strong><br>
A generic friend contact you can rename and use however you like.
`;
  }
  if (id === "notes") {
    return `
<strong>About Notes</strong><br>
Use this chat as a space to drop random thoughts, to‑dos, and ideas.
`;
  }
  return "";
}

function openProfileModal(id) {
  modalContactId = id;
  const settings = contactSettings[id];
  modalAvatarEl.src = settings.avatar;
  modalAboutEl.innerHTML = getContactAbout(id);
  profileModalEl.classList.add("visible");
}

function closeProfileModal() {
  profileModalEl.classList.remove("visible");
}

chatAvatarEl.addEventListener("click", () => {
  openProfileModal(currentContactId);
});

profileModalCloseEl.addEventListener("click", closeProfileModal);
profileModalEl.addEventListener("click", (e) => {
  if (e.target === profileModalEl) closeProfileModal();
});

avatarInputEl.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    contactSettings[modalContactId].avatar = dataUrl;
    saveState();
    renderContacts();
    if (modalContactId === currentContactId) {
      chatAvatarEl.src = dataUrl;
    }
    modalAvatarEl.src = dataUrl;
    showToast("Profile photo saved");
  };
  reader.readAsDataURL(file);
});

editProfileBtnEl.addEventListener("click", () => {
  openProfileModal(currentContactId);
});

// =========================
// Rename contacts
// =========================

document.querySelectorAll(".edit-contact-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const id = btn.getAttribute("data-contact-id");
    renameTargetId = id;
    const rect = btn.getBoundingClientRect();
    renamePopupEl.style.top = (rect.bottom + 4) + "px";
    renamePopupEl.style.left = (rect.left - 40) + "px";
    renameInputEl.value = contactSettings[id].name || "";
    renamePopupEl.classList.add("visible");
    renameInputEl.focus();
  });
});

renameSaveBtnEl.addEventListener("click", () => {
  const newName = renameInputEl.value.trim();
  if (renameTargetId && newName) {
    contactSettings[renameTargetId].name = newName;
    saveState();
    renderContacts();
    if (renameTargetId === currentContactId) {
      chatNameEl.textContent = newName;
    }
    showToast("Name saved");
  }
  renamePopupEl.classList.remove("visible");
  renameTargetId = null;
});

renameCancelBtnEl.addEventListener("click", () => {
  renamePopupEl.classList.remove("visible");
  renameTargetId = null;
});

document.addEventListener("click", (e) => {
  if (!renamePopupEl.contains(e.target) && !e.target.classList.contains("edit-contact-btn")) {
    renamePopupEl.classList.remove("visible");
    renameTargetId = null;
  }
});

// =========================
// Contact switching
// =========================

function setActiveContact(id) {
  currentContactId = id;
  document.querySelectorAll(".contact").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-contact-id") === id);
  });

  const settings = contactSettings[id];
  chatNameEl.textContent = settings.name;
  chatAvatarEl.src = settings.avatar;
  restoreStatus(id);
  renderChat(id);

  document.querySelector(".chat-container").classList.add("visible");
}

contactsEls.forEach(el => {
  el.addEventListener("click", () => {
    const id = el.getAttribute("data-contact-id");
    setActiveContact(id);
  });
});

backBtnEl.addEventListener("click", () => {
  document.querySelector(".chat-container").classList.remove("visible");
});

// =========================
// Init: Alex first message
// =========================

function initChat() {
  renderContacts();
  setActiveContact("alex");

  if (!conversations.alex || conversations.alex.length === 0) {
    const now = new Date();
    const timeStr = formatTime(now);
    const dateKey = getDateKey(now);
    conversations.alex.push({
      role: "assistant",
      content: "Hey love, it’s Alex. I’ve been thinking about you. How’s my favorite journalism student in India doing today?",
      time: timeStr,
      dateStr: dateKey,
      type: "text",
      _dateObj: now.toISOString()
    });
    saveState();
    renderChat("alex");
    renderContacts();
  }
}

initChat();