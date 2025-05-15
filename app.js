// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBs-lWw85bi3YYcfE4b8EXGqeP3XOATUCg",
  authDomain: "solar-webchat.firebaseapp.com",
  databaseURL: "https://solar-webchat-default-rtdb.firebaseio.com",
  projectId: "solar-webchat",
  storageBucket: "solar-webchat.firebasestorage.app",
  messagingSenderId: "G-9Q02HWXP58",
  appId: "1:554037375442:web:3caa7fa4e72734efc8580b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const chatRef = db.ref("messages");

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const username = "User" + Math.floor(Math.random() * 1000); // Random name

function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  chatRef.push({
    user: username,
    text: message,
    timestamp: Date.now()
  });

  input.value = "";
}

// Listen for new messages
chatRef.on("child_added", (snapshot) => {
  const data = snapshot.val();
  const msg = document.createElement("div");
  msg.className = "message " + (data.user === username ? "sent" : "received");
  msg.textContent = `${data.user}: ${data.text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});
