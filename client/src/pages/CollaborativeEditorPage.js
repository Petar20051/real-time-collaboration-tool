import React, { useState } from 'react';
import Chat from '../components/Chat';
import ActiveUsers from '../components/ActiveUsers';
import CollaborativeEditor from '../components/CollaborativeEditor';
import '../styles/CollaborativeEditorPage.css';

const CollaborativeEditorPage = () => {
  const [roomId, setRoomId] = useState('');
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setIsRoomJoined(true);
    }
  };

  const handleLeaveRoom = () => {
    setIsRoomJoined(false);
  };

  return (
    <div className="collaborative-editor-page">
      {!isRoomJoined ? (
        <div className="join-room-container">
          <h1>Join a Room</h1>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="room-input"
          />
          <button onClick={handleJoinRoom} className="join-room-btn">
            Join Room
          </button>
        </div>
      ) : (
        <div className="collab-layout">
          <div className="sidebar">
            <h2>Chat</h2>
            <Chat roomId={roomId} />
            <h2>Active Users</h2>
            <ActiveUsers users={['User1', 'User2']} />
          </div>
          <div className="editor-container">
            <h2>Collaborative Editor</h2>
            <button onClick={handleLeaveRoom} className="leave-room-btn">
              Leave Room
            </button>
            <CollaborativeEditor roomId={roomId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditorPage;
