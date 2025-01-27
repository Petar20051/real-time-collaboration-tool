
import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import socket from '../socket';

const CollaborativeEditor = () => {
  const editorRef = useRef(null);

  useEffect(() => {
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
    });

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        socket.emit('send-changes', delta);
      }
    });

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta);
    });

    return () => {
      socket.off('receive-changes');
    };
  }, []);

  return <div ref={editorRef} />;
};

export default CollaborativeEditor;
