import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Chat from '../components/Chat';
import ActiveUsers from '../components/ActiveUsers';
import CollaborativeEditor from '../components/CollaborativeEditor';
import FileUpload from '../components/FileUpload';
import PasswordManager from '../components/PasswordManager';
import '../styles/CollaborativeEditorPage.css';
import axios from 'axios';
import socket from '../socket';
import AudioMeeting from '../components/AudioMeeting';


const CollaborativeEditorPage = () => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { auth } = useContext(AuthContext);
  const [activeUsers, setActiveUsers] = useState([]);

  const checkRoomStatus = async () => {
    if (!roomId.trim()) {
      setRequiresPassword(false);
      setIsOwner(false);
      return;
    }
  
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('You must be logged in.');
        return;
      }
  
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      const userId = decodedToken.id; 
  
      
      const response = await axios.get(`http://localhost:4000/api/documents/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const roomData = response.data;
  
      
      if (roomData.ownerId === userId) {
        console.log("✅ Owner detected, joining without password.");
        setRequiresPassword(false);
        setIsOwner(true);
        joinRoom({ token, password: null }); 
        return;
      }
  
      
      if (roomData.isPrivate) {
        setRequiresPassword(true);
        setIsOwner(false);
      } else {
        setRequiresPassword(false);
        setIsOwner(false);
      }
  
    } catch (error) {
      console.error('❌ Error checking room:', error.response?.data || error.message);
    }
  };
  

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
  
   
    if (requiresPassword && !password.trim()) {
      alert('Please enter the password to join this room.');
      return;
    }
  
   
    joinRoom({ token, password });
  };
  
  
  const joinRoom = ({ token, password }) => {
    socket.emit('join-room', { roomId, token, password });
  
    socket.once('room-joined', (data) => {
      if (data.error) {
        alert(`❌ ${data.error}`);
        return;
      }
  
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      const userId = decodedToken.id; 
  
      
      const isOwner = data.ownerId === userId;
  
      setIsRoomJoined(true);
      setIsOwner(isOwner);
      setRequiresPassword(!isOwner && data.role === 'participant'); 
  
     
      socket.emit('request-active-users', roomId);
    });
  
    
    socket.on('user-list', (users) => {
      setActiveUsers(users);
    });
  
    socket.once('error', (message) => {
      alert(`❌ ${message}`);
    });
  };
  
  
  const handleLeaveRoom = () => {
    socket.emit('leave-room', roomId);
    setRoomId('');
    setPassword('');
    setIsRoomJoined(false);
    setActiveUsers([]);
    setIsOwner(false);
    setRequiresPassword(false);
  };

  useEffect(() => {
    if (socket) return;
    if (isRoomJoined && roomId) {
      const token = localStorage.getItem('authToken');
  
      
      if (!socket.hasListeners('user-list')) {
        socket.emit('join-room', { roomId, token, password });
  
        socket.on('user-list', (users) => {
          setActiveUsers(users);
        });
      }
  
      return () => {
        socket.emit('leave-room', roomId);
        socket.off('user-list');
        socket.off('room-joined'); 
      };
    }
  }, [isRoomJoined, roomId]); 
  
  
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
            onBlur={checkRoomStatus}
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
        </div>
      ) : (
        <div className="collab-layout">
         
          <div className="sidebar">
            <div className="audio-meeting-container">
              <h2>Audio Meeting</h2>
              <AudioMeeting roomId={roomId} />
            </div>
            <div className="password-manager">
              <PasswordManager
                roomId={roomId}
                isOwner={isOwner}
                requiresPassword={requiresPassword}
                setIsOwner={setIsOwner}
                setRequiresPassword={setRequiresPassword}
              />
            </div>
            <div className="active-users-container">
              <h2>Active Users</h2>
              <ActiveUsers users={activeUsers} />
            </div>
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

         
          <div className="sidebar">
            <div className="chat-container">
              <h2>Chat</h2>
              <Chat roomId={roomId} />
            </div>
            <div className="file-sharing-container">
              <FileUpload roomId={roomId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditorPage;
  

