import React, { useState, useEffect } from 'react';
import socket from '../socket';
import '../styles/Chat.css';

const Chat = ({ roomId }) => {
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
      socket.emit('message', { roomId, content: input });
      setMessages((prevMessages) => [...prevMessages, { content: input }]);
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <h3 className="chat-title">Room Chat</h3>
      <div className="chat-body">
        {messages.map((msg, index) => (
          <p key={index} className="chat-message">{msg.content}</p>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button onClick={sendMessage} className="chat-send-btn">Send</button>
      </div>
    </div>
  );
};

export default Chat;
