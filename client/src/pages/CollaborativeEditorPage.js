import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Chat from '../components/Chat';
import ActiveUsers from '../components/ActiveUsers';
import CollaborativeEditor from '../components/CollaborativeEditor';
import FileUpload from '../components/FileUpload';
import '../styles/CollaborativeEditorPage.css';
import axios from 'axios';
import socket from '../socket';

const CollaborativeEditorPage = () => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const { auth } = useContext(AuthContext);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (isRoomJoined) {
      const token = localStorage.getItem('authToken');
      socket.emit('join-room', { roomId, token });

      socket.on('user-list', (users) => {
        setActiveUsers(users);
      });

      return () => {
        socket.emit('leave-room', roomId);
        socket.off('user-list');
      };
    }
  }, [isRoomJoined, roomId]);

  const checkRoomPassword = async () => {
    if (!roomId.trim()) {
      alert('Please enter a valid Room ID');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:4000/api/documents/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      setRequiresPassword(response.data.requiresPassword);
    } catch (error) {
      console.error('❌ Error checking room:', error.response?.data || error.message);
    }
  };

  
  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      alert('Please enter a valid Room ID');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to join a room');
      return;
    }

    if (requiresPassword) {
      try {
        const response = await axios.post(
          `http://localhost:4000/api/documents/${roomId}/check-password`,
          { password },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data.correct) {
          alert('Incorrect password!');
          return;
        }
      } catch (error) {
        console.error('❌ Error verifying password:', error.response?.data || error.message);
        return;
      }
    }

    setIsRoomJoined(true);
  };

  
  const handleSetPassword = async () => {
    if (!password.trim()) {
      alert('Please enter a password');
      return;
    }

    try {
      await axios.post(
        `http://localhost:4000/api/documents/${roomId}/set-password`,
        { password },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      alert('✅ Password set successfully!');
      setRequiresPassword(true);
    } catch (error) {
      console.error('❌ Error setting password:', error.response?.data || error.message);
    }
  };

  const handleRemovePassword = async () => {
    try {
      await axios.post(
        `http://localhost:4000/api/documents/${roomId}/remove-password`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      alert('✅ Password removed!');
      setRequiresPassword(false);
    } catch (error) {
      console.error('❌ Error removing password:', error.response?.data || error.message);
    }
  };

  const handleLeaveRoom = () => {
    socket.emit('leave-room', roomId);
    setRoomId('');
    setPassword('');
    setIsRoomJoined(false);
    setActiveUsers([]);
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
            onBlur={checkRoomPassword}
          />

          {requiresPassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Room Password"
              className="room-input"
            />
          )}

          <button onClick={handleJoinRoom} className="join-room-btn">
            Join Room
          </button>

          {!requiresPassword && (
            <button onClick={handleSetPassword} className="set-password-btn">
              Set Password (Become Owner)
            </button>
          )}
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
              {requiresPassword && (
                <button onClick={handleRemovePassword} className="remove-password-btn">
                  Remove Password
                </button>
              )}
            </div>
            <CollaborativeEditor roomId={roomId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditorPage;
