import React, { useState, useEffect } from 'react';
import socket from '../socket';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('message', input);
      setMessages((prevMessages) => [...prevMessages, input]);
      setInput('');
    }
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '6px',
        padding: '10px',
        maxHeight: '500px',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <p key={index} style={{ margin: '5px 0', wordBreak: 'break-word' }}>
            {msg}
          </p>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '8px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
