import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import socket from '../socket';
import axios from 'axios';

const CollaborativeEditor = ({ roomId }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline'],
          ['image', 'code-block']
        ]
      }
    });

    // Load existing document content from the backend
    const loadDocument = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/documents/${roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        quill.setContents(response.data.content);
      } catch (err) {
        console.error('Error loading document:', err);
      }
    };

    loadDocument();

    // Join the room
    socket.emit('join-room', roomId);

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        socket.emit('send-changes', delta, roomId);
      }
    });

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta);
    });

    // Auto-save document
    const saveInterval = setInterval(async () => {
      try {
        const content = quill.getContents();
        await axios.post(`http://localhost:4000/api/documents/${roomId}`, { content }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      } catch (err) {
        console.error('Error saving document:', err);
      }
    }, 2000);

    return () => {
      socket.off('receive-changes');
      clearInterval(saveInterval);
    };
  }, [roomId]);

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: 'auto', padding: '10px', border: '1px solid #ccc' }}>
      <div ref={editorRef} style={{ height: '500px' }} />
    </div>
  );
};

export default CollaborativeEditor;
