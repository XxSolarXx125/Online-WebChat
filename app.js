// Utility: Escape HTML to avoid XSS
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    '&': "&amp;",
    '<': "&lt;",
    '>': "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}

// Check if a user is a mod (you can customize this logic)
function isModUser(user) {
  return user === username && isMod;
}

// Render message function, used for adding new messages and updating them
function renderMessage(data, msgId) {
  const msg = document.createElement("div");
  msg.className = "message " + (data.user === username ? "sent" : "received");
  msg.dataset.key = msgId;

  // MOD prefix for display username
  const displayUser = isModUser(data.user) ? `[ MOD ] : ${escapeHtml(data.user)}` : escapeHtml(data.user);

  msg.innerHTML = `
    <div class="message-text"><strong>${displayUser}</strong>: <span class="text">${escapeHtml(data.text)}</span></div>
    <div class="meta">${new Date(data.timestamp).toLocaleTimeString()}</div>
    ${isMod ? `
      <div class="edit-delete-btns">
        <button class="edit-btn" aria-label="Edit message">Edit</button>
        <button class="delete-btn" aria-label="Delete message">Delete</button>
      </div>` : ''}
  `;

  if (isMod) {
    msg.querySelector(".edit-btn").onclick = () => editMessage(msgId, msg);
    msg.querySelector(".delete-btn").onclick = () => deleteMessage(msgId, msg);
  }

  return msg;
}

// Listen for new messages and render them
chatRef.on("child_added", (snapshot) => {
  const data = snapshot.val();
  const msgId = snapshot.key;

  const msg = renderMessage(data, msgId);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Edit message function
function editMessage(msgId, msgElement) {
  const textSpan = msgElement.querySelector(".text");
  const oldText = textSpan.textContent;

  // Replace text with input box
  const inputEdit = document.createElement("input");
  inputEdit.type = "text";
  inputEdit.value = oldText;
  inputEdit.style.width = "80%";
  inputEdit.className = "edit-input";

  msgElement.querySelector(".message-text").replaceChild(inputEdit, textSpan);
  inputEdit.focus();

  function finishEditing(newText) {
    if (newText.trim().length === 0) {
      alert("Message cannot be empty.");
      inputEdit.focus();
      return false;
    }
    chatRef.child(msgId).update({ text: newText.trim() });
    return true;
  }

  inputEdit.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (finishEditing(inputEdit.value)) {
        // Replace input with updated text span
        const newSpan = document.createElement("span");
        newSpan.className = "text";
        newSpan.textContent = inputEdit.value.trim();
        inputEdit.parentNode.replaceChild(newSpan, inputEdit);
      }
    } else if (e.key === "Escape") {
      inputEdit.parentNode.replaceChild(textSpan, inputEdit);
    }
  });

  inputEdit.addEventListener("blur", () => {
    if (document.activeElement !== inputEdit) {
      inputEdit.parentNode.replaceChild(textSpan, inputEdit);
    }
  });
}

// Delete message function
function deleteMessage(msgId, msgElement) {
  if (confirm("Are you sure you want to delete this message?")) {
    chatRef.child(msgId).remove();
    msgElement.remove();
  }
}

// Update messages on change (e.g. edits)
chatRef.on("child_changed", (snapshot) => {
  const data = snapshot.val();
  const msgId = snapshot.key;

  const msgElement = [...chatBox.children].find(c => c.dataset.key === msgId);
  if (msgElement) {
    const textSpan = msgElement.querySelector(".text");
    if (textSpan) {
      textSpan.textContent = data.text;
    }
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

// Typing indicator debounce logic to avoid too many writes
let typingTimeout;
input.addEventListener("input", () => {
  typingRef.child(userId).set({ username });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingRef.child(userId).remove();
  }, 2000);
});

// Show typing status of other users
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
