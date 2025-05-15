const firebaseConfig = {
  apiKey: "AIzaSyBs-lWw85bi3YYcfE4b8EXGqeP3XOATUCg",
  authDomain: "solar-webchat.firebaseapp.com",
  databaseURL: "https://solar-webchat-default-rtdb.firebaseio.com",
  projectId: "solar-webchat",
  storageBucket: "solar-webchat.appspot.com",
  messagingSenderId: "554037375442",
  appId: "1:554037375442:web:3caa7fa4e72734efc8580b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const chatRef = db.ref("messages");
const typingRef = db.ref("typing");
const onlineRef = db.ref("online");

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const typingStatus = document.getElementById("typingStatus");
const onlineUsers = document.getElementById("onlineUsers");

let username = prompt("Enter your username:");
if (!username) username = "User" + Math.floor(Math.random() * 1000);

const userId = Date.now().toString();
let isMod = false; // Moderator flag

// Add user online
onlineRef.child(userId).set({ username });
onlineRef.child(userId).onDisconnect().remove();

// Moderation Checker
fetch('Mods.txt')
  .then(res => res.text())
  .then(text => {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^Username:\s*(\w+)\s*Password:\s*(.+)$/);
      if (match) {
        const [_, fileUsername, filePassword] = match;
        if (fileUsername === username) {
          const entered = prompt("Moderation Checker: Enter the password for this username:");
          if (entered === filePassword) {
            isMod = true;
            alert("Access granted. Moderator privileges enabled.");
          } else {
            alert("Access denied. Incorrect password.");
            username = "User" + Math.floor(Math.random() * 1000); // fallback to random user
          }
          break;
        }
      }
    }
  });

// Play send message sound
const sendSound = new Audio('ping.mp3');

// Send message function
function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  chatRef.push({
    user: username,
    text: message,
    timestamp: Date.now()
  });

  sendSound.play().catch(() => {
    // Ignore play errors if user hasn't interacted yet
  });

  input.value = "";
  typingRef.child(userId).remove();
}

// Listen for new messages
chatRef.on("child_added", (snapshot) => {
  const data = snapshot.val();
  const msgId = snapshot.key;

  const msg = document.createElement("div");
  msg.className = "message " + (data.user === username ? "sent" : "received");
  msg.dataset.key = msgId;

  // Message HTML with edit/delete buttons for mods
  msg.innerHTML = `
    <div class="message-text"><strong>${escapeHtml(data.user)}</strong>: <span class="text">${escapeHtml(data.text)}</span></div>
    <div class="meta">${new Date(data.timestamp).toLocaleTimeString()}</div>
    ${isMod ? `
      <div class="edit-delete-btns">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>` : ''}
  `;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (isMod) {
    // Attach event listeners for edit/delete
    msg.querySelector(".edit-btn").onclick = () => editMessage(msgId, msg);
    msg.querySelector(".delete-btn").onclick = () => deleteMessage(msgId, msg);
  }
});

// Escape HTML to avoid XSS
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    '&': "&amp;",
    '<': "&lt;",
    '>':






ChatGPT said:
">",
'"': """,
"'": "'"
})[m]);
}

// Edit message
function editMessage(msgId, msgDiv) {
const textSpan = msgDiv.querySelector(".text");
const currentText = textSpan.textContent;
const newText = prompt("Edit message:", currentText);
if (newText !== null) {
chatRef.child(msgId).update({ text: newText });
}
}

// Delete message
function deleteMessage(msgId, msgDiv) {
if (confirm("Delete this message?")) {
chatRef.child(msgId).remove();
}
}

// Update messages on edit/delete
chatRef.on("child_changed", (snapshot) => {
const data = snapshot.val();
const msgId = snapshot.key;

const msgDiv = [...chatBox.children].find(el => el.dataset.key === msgId);
if (msgDiv) {
const textSpan = msgDiv.querySelector(".text");
textSpan.textContent = data.text;
}
});

chatRef.on("child_removed", (snapshot) => {
const msgId = snapshot.key;
const msgDiv = [...chatBox.children].find(el => el.dataset.key === msgId);
if (msgDiv) {
msgDiv.remove();
}
});

// Typing indicator
let typingTimeout;
input.addEventListener("input", () => {
typingRef.child(userId).set(username);
clearTimeout(typingTimeout);
typingTimeout = setTimeout(() => {
typingRef.child(userId).remove();
}, 1500);
});

typingRef.on("value", snapshot => {
const typingUsers = snapshot.val();
if (!typingUsers) {
typingStatus.textContent = "Nobody is typing...";
} else {
const names = Object.values(typingUsers).filter(name => name !== username);
if (names.length === 0) {
typingStatus.textContent = "Nobody is typing...";
} else if (names.length === 1) {
typingStatus.textContent = ${names[0]} is typing...;
} else {
typingStatus.textContent = ${names.join(", ")} are typing...;
}
}
});

// Online users count
onlineRef.on("value", snapshot => {
const users = snapshot.val() || {};
const count = Object.keys(users).length;
onlineUsers.textContent = Online: ${count};
});

// Scroll chat to bottom on window resize (for mobile keyboard)
window.addEventListener('resize', () => {
chatBox.scrollTop = chatBox.scrollHeight;
});
