import React, { useState } from "react";
import CollaborativeEditor from "../components/CollaborativeEditor";
import Chat from "../components/Chat";
import "../styles/CollaborativeEditorPage.css";

const CollaborativeEditorPage = () => {
  const [roomId, setRoomId] = useState("");
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  const handleJoinRoom = () => {
    if (roomId.trim() === "") {
      alert("Please enter a valid Room ID.");
      return;
    }
    setIsRoomJoined(true);
  };

  const handleLeaveRoom = () => {
    setIsRoomJoined(false);
    setRoomId("");
  };

  return (
    <div className="collab-page">
      <h1 className="page-title">Collaborative Editor</h1>

      {!isRoomJoined ? (
        <div className="join-room-container">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="room-input"
          />
          <button className="join-room-btn" onClick={handleJoinRoom}>
            Join Room
          </button>
        </div>
      ) : (
        <div>
          <div className="collab-container">
            {/* Chat Sidebar */}
            <div className="chat-sidebar">
              <h3 className="chat-title">Room Chat</h3>
              <div className="chat-body">
                <Chat />
              </div>
            </div>

            {/* Document Editor */}
            <div className="editor-container">
              <h3 className="editor-title">Document Editor</h3>
              <CollaborativeEditor roomId={roomId} />
            </div>
          </div>

          {/* Leave Room Button */}
          <div className="leave-room-container">
            <button className="leave-room-btn" onClick={handleLeaveRoom}>
              Leave Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditorPage;
