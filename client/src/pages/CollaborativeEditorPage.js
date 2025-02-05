import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Chat from '../components/Chat';
import ActiveUsers from '../components/ActiveUsers';
import CollaborativeEditor from '../components/CollaborativeEditor';
import FileUpload from '../components/FileUpload'; // ✅ Import FileUpload component
import '../styles/CollaborativeEditorPage.css';
import socket from '../socket';

const CollaborativeEditorPage = () => {
  const [roomId, setRoomId] = useState('');
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const { auth } = useContext(AuthContext);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (isRoomJoined) {
      const token = localStorage.getItem('authToken');
      socket.emit('join-room', { roomId, token });

      // ✅ Listen for active users list from server
      socket.on('user-list', (users) => {
        setActiveUsers(users);
      });

      return () => {
        socket.emit('leave-room', roomId);
        socket.off('user-list'); // ✅ Remove event listener when leaving room
      };
    }
  }, [isRoomJoined, roomId]);

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert('Please enter a valid Room ID');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to join a room');
      return;
    }

    setIsRoomJoined(true);
  };

  const handleLeaveRoom = () => {
    socket.emit('leave-room', roomId);
    setRoomId('');
    setIsRoomJoined(false);
    setActiveUsers([]); // ✅ Clear active users when leaving the room
  };

  if (!auth?.token) {
    return <h1>You must be logged in to access this page.</h1>;
  }

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
            <ActiveUsers users={activeUsers} />
            <FileUpload roomId={roomId} /> 
          </div>

          <div className="editor-container">
            <div className="editor-header">
              <h2>Collaborative Editor</h2>
              <button onClick={handleLeaveRoom} className="leave-room-btn">
                Leave Room
              </button>
            </div>
            <CollaborativeEditor roomId={roomId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditorPage;
