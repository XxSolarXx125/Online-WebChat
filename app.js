const firebaseConfig = {
  apiKey: "AIzaSyBs-lWw85bi3YYcfE4b8EXGqeP3XOATUCg",
  authDomain: "solar-webchat.firebaseapp.com",
  databaseURL: "https://solar-webchat-default-rtdb.firebaseio.com",
  projectId: "solar-webchat",
  storageBucket: "solar-webchat.firebasestorage.app",
  messagingSenderId: "554037375442",
  appId: "1:554037375442:web:3caa7fa4e72734efc8580b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const chatRef = db.ref("messages");
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");

// Get user info
let username = localStorage.getItem("chat_username");
let avatarUrl = localStorage.getItem("chat_avatar");

async function promptUserInfo() {
  username = prompt("Enter your name:") || "Anonymous";
  let method = confirm("Click OK to upload an image, or Cancel to paste an image URL.");

  if (method) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        avatarUrl = reader.result;
        localStorage.setItem("chat_username", username);
        localStorage.setItem("chat_avatar", avatarUrl);
      };
      reader.readAsDataURL(file);
    };

    fileInput.click();
  } else {
    avatarUrl = prompt("Paste the image URL:");
    localStorage.setItem("chat_username", username);
    localStorage.setItem("chat_avatar", avatarUrl);
  }
}

if (!username || !avatarUrl) {
  promptUserInfo();
}

function sendMessage() {
  const message = input.value.trim();
  if (!message || !username || !avatarUrl) return;

  chatRef.push({
    user: username,
    avatar: avatarUrl,
    text: message,
    timestamp: Date.now()
  });

  input.value = "";
}

chatRef.on("child_added", (snapshot) => {
  const data = snapshot.val();
  const msg = document.createElement("div");
  msg.className = "message " + (data.user === username ? "sent" : "received");

  msg.innerHTML = `
    <img src="${data.avatar}" alt="avatar" />
    <div class="message-content">
      <strong>${data.user}</strong><br>${data.text}
    </div>
  `;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});
