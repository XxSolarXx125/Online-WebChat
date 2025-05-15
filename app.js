const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");

function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  // Add sent message
  const msg = document.createElement("div");
  msg.className = "message sent";
  msg.textContent = message;
  chatBox.appendChild(msg);
  input.value = "";

  // Auto-scroll
  chatBox.scrollTop = chatBox.scrollHeight;

  // Simulate a reply
  setTimeout(() => {
    const reply = document.createElement("div");
    reply.className = "message received";
    reply.textContent = "Reply: " + message;
    chatBox.appendChild(reply);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 1000);
}
