import React, { useState } from 'react';
import CollaborativeEditor from '../components/CollaborativeEditor';

const CollaborativeEditorPage = () => {
  const [roomId, setRoomId] = useState('');
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  const handleJoinRoom = () => {
    if (roomId.trim() === '') {
      alert('Please enter a valid Room ID.');
      return;
    }
    setIsRoomJoined(true);
  };

  const handleLeaveRoom = () => {
    setIsRoomJoined(false);
    setRoomId('');
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Collaborative Editor</h1>

      {!isRoomJoined ? (
        <div style={{ margin: '20px auto', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              marginBottom: '10px',
              fontSize: '16px',
            }}
          />
          <button
            onClick={handleJoinRoom}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Join Room
          </button>
        </div>
      ) : (
        <div>
          <p>
            <strong>Room ID:</strong> {roomId}
          </p>
          <button
            onClick={handleLeaveRoom}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            Leave Room
          </button>
          <CollaborativeEditor roomId={roomId} />
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditorPage;
