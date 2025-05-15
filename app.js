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

onlineRef.child(userId).set({ username });
onlineRef.child(userId).onDisconnect().remove();

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

chatRef.on("child_added", (snapshot) => {
  const data = snapshot.val();
  const msg = document.createElement("div");
  msg.className = "message " + (data.user === username ? "sent" : "received");

  msg.innerHTML = `
    <div><strong>${data.user}</strong>: ${data.text}</div>
    <div class="meta">${new Date(data.timestamp).toLocaleTimeString()}</div>
  `;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

input.addEventListener("input", () => {
  typingRef.child(userId).set({ username });
  setTimeout(() => typingRef.child(userId).remove(), 2000);
});

typingRef.on("value", (snapshot) => {
  const data = snapshot.val() || {};
  const names = Object.values(data).map(v => v.username).filter(n => n !== username);
  typingStatus.textContent = names.length ? `${names.join(", ")} typing...` : "Nobody is typing...";
});

onlineRef.on("value", (snapshot) => {
  const count = snapshot.numChildren();
  onlineUsers.textContent = `Online: ${count}`;
});
