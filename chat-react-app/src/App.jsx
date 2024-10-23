import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onChildAdded } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function App() {
  const [myName, setMyName] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showProfileSetup, setShowProfileSetup] = useState(true);

  const messageListRef = useRef(null); // Create a ref for the message list

  useEffect(() => {
    loadAvatars();
    const messageRef = ref(db, "messages");
    onChildAdded(messageRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.sender && data.message) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const loadAvatars = () => {
    const avatarSelector = document.getElementById("avatarSelector");
    const numAvatars = 7;
    const avatarStyle = "lorelei";

    for (let i = 0; i < numAvatars; i++) {
      const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${i}`;
      const img = document.createElement("img");
      img.src = avatarUrl;
      img.alt = `Avatar ${i}`;
      img.className = "avatar-option";
      img.dataset.avatar = avatarUrl;
      img.addEventListener("click", () => selectAvatar(avatarUrl));
      avatarSelector.appendChild(img);
    }
  };

  const selectAvatar = (avatarUrl) => {
    setProfilePicUrl(avatarUrl);
    const profilePicPreview = document.getElementById("profilePicPreview");
    profilePicPreview.src = avatarUrl;
    profilePicPreview.classList.add("selected");
  };

  const saveProfile = () => {
    if (myName.trim() && profilePicUrl) {
      setShowProfileSetup(false);
      console.log("Profile saved successfully");

      // Use setTimeout to ensure the scrolling happens after rendering
      setTimeout(scrollToBottom, 0);

      // Optionally clear the preview image if you want
      const profilePicPreview = document.getElementById("profilePicPreview");
      if (profilePicPreview) {
        profilePicPreview.src = profilePicUrl; // Ensure profilePicUrl is set correctly
        profilePicPreview.classList.add("selected");
      }
    } else {
      console.warn("Name or avatar cannot be empty");
    }
  };

  const sendMsg = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessageRef = push(ref(db, "messages"));
      set(newMessageRef, {
        sender: myName,
        message: message,
        profilePic: profilePicUrl || "default-avatar.png", // Ensure a default avatar is used if none is selected
      }).catch((error) => {
        console.error("Error writing new message to Firebase:", error);
      });
      setMessage("");
    } else {
      console.warn("Message is empty");
    }
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  return (
    <div className="chat-container">
      <header>
        <h1>Chat</h1>
      </header>
      {showProfileSetup ? (
        <div className="profile-setup">
          <input
            type="text"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="Enter your name"
          />
          <div id="avatarSelector" className="avatar-selector"></div>
          <img
            id="profilePicPreview"
            className="profile-pic-preview"
            src=""
            alt="Profile Picture Preview"
          />
          <button onClick={saveProfile} className="save-profile-button">
            Save Profile
          </button>
        </div>
      ) : (
        <>
          <ul id="messages" className="message-list" ref={messageListRef}>
            {messages.map((msg, index) => (
              <li
                key={index}
                className={`message ${
                  msg.sender === myName ? "sent" : "received"
                }`}
              >
                <img
                  className="avatar"
                  src={msg.profilePic || "default-avatar.png"}
                  alt={`${msg.sender}'s Avatar`}
                />
                <div className="message-content">
                  <span className="message-sender">{msg.sender}</span>
                  <span className="message-text">{msg.message}</span>
                </div>
              </li>
            ))}
          </ul>
          <form id="messageForm" className="message-form" onSubmit={sendMsg}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field"
              placeholder="Type a message..."
            />
            <button type="submit" className="send-button">
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default App;
