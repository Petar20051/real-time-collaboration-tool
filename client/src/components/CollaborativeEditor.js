import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/CollaborativeEditor.css';
import axios from 'axios';
import socket from '../socket';

const CollaborativeEditor = ({ roomId }) => {
  const editorRef = useRef(null); // Reference for the editor container
  const quillRef = useRef(null); // Reference for the Quill editor instance

  useEffect(() => {
    if (!roomId) {
      console.error('❌ Room ID is not provided.');
      return;
    }

    // Initialize the Quill editor only once
    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['image', 'code-block'],
          ],
        },
      });
    }

    // Load the document content from the backend
    const loadDocument = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('❌ No authentication token found.');
          return;
        }

        const response = await axios.get(
          `http://localhost:4000/api/documents/${roomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.content) {
          quillRef.current.setContents(response.data.content);
          console.log('✅ Document loaded successfully.');
        }
      } catch (error) {
        console.error('❌ Error loading document:', error);
      }
    };

    loadDocument();

    // Handle receiving real-time changes
    const handleReceiveChanges = (delta) => {
      if (quillRef.current) {
        quillRef.current.updateContents(delta);
      }
    };

    // Handle local text changes and emit them to the server
    const handleTextChange = (delta, oldDelta, source) => {
      if (source === 'user') {
        socket.emit('send-changes', { delta, roomId });
      }
    };

    // Register event listeners
    socket.on('receive-changes', handleReceiveChanges);
    quillRef.current.on('text-change', handleTextChange);

    // Cleanup on unmount
    return () => {
      socket.off('receive-changes', handleReceiveChanges);
      if (quillRef.current) {
        quillRef.current.off('text-change', handleTextChange);
      }
    };
  }, [roomId]); // Effect runs when `roomId` changes

  return <div ref={editorRef} className="editor"></div>;
};

export default CollaborativeEditor;
