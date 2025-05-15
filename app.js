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

// Send message function
function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  chatRef.push({
    user: username,
    text: message,
    timestamp: Date.now()
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
    '>': "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}

// Edit message
function editMessage(msgId, msgElement) {
  const textSpan = msgElement.querySelector(".text");
  const oldText = textSpan.textContent;

  // Replace text with input box
  const inputEdit = document.createElement("input");
  inputEdit.type = "text";
  inputEdit.value = oldText;
  inputEdit.style.width = "80%";

  msgElement.querySelector(".message-text").replaceChild(inputEdit, textSpan);

  inputEdit.focus();

  inputEdit.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const newText = inputEdit.value.trim();
      if (newText.length === 0) {
        alert("Message cannot be empty.");
        inputEdit.focus();
        return;
      }

      chatRef.child(msgId).update({ text: newText });

      // Replace input with updated text span
      const newSpan = document.createElement("span");
      newSpan.className = "text";
      newSpan.textContent = newText;
      inputEdit.parentNode.replaceChild(newSpan, inputEdit);
    }
    else if (e.key === "Escape") {
      // Cancel editing
      inputEdit.parentNode.replaceChild(textSpan, inputEdit);
    }
  });

  // Clicking outside cancels edit (optional)
  inputEdit.addEventListener("blur", () => {
    if (document.activeElement !== inputEdit) {
      inputEdit.parentNode.replaceChild(textSpan, inputEdit);
    }
  });
}

// Delete message
function deleteMessage(msgId, msgElement) {
  if (confirm("Are you sure you want to delete this message?")) {
    chatRef.child(msgId).remove();
    msgElement.remove();
  }
}

// Update messages on change
chatRef.on("child_changed", (snapshot) => {
  const data = snapshot.val();
  const msgId = snapshot.key;

  const msgElement = [...chatBox.children].find(c => c.dataset.key === msgId);
  if (msgElement) {
    const textSpan = msgElement.querySelector(".text");
    if (textSpan) textSpan.textContent = data.text;
  }
});

// Remove messages on delete
chatRef.on("child_removed", (snapshot) => {
  const msgId = snapshot.key;
  const msgElement = [...chatBox.children].find(c => c.dataset.key === msgId);
  if (msgElement) {
    msgElement.remove();
  }
});

// Typing indicator
input.addEventListener("input", () => {
  typingRef.child(userId).set({ username });
  setTimeout(() => typingRef.child(userId).remove(), 2000);
});

typingRef.on("value", (snapshot) => {
  const data = snapshot.val() || {};
  const names = Object.values(data).map(v => v.username).filter(n => n !== username);
  typingStatus.textContent = names.length ? `${names.join(", ")} typing...` : "Nobody is typing...";
});

// Online users count
onlineRef.on("value", (snapshot) => {
  const count = snapshot.numChildren();
  onlineUsers.textContent = `Online: ${count}`;
});
