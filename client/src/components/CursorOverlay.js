import React from 'react';
import '../styles/CursorOverlay.css'; // ✅ Import cursor styling

const CursorOverlay = ({ cursors }) => {
    return (
      <>
        {Object.entries(cursors).map(([userId, cursor]) => (
          <div
            key={userId}
            className="cursor-marker"
            style={{ left: cursor.position.left, top: cursor.position.top }}
          >
            <span className="cursor-label">{cursor.username}</span>
          </div>
        ))}
      </>
    );
  };
  
  

export default CursorOverlay;
