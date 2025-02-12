import React from 'react';
import '../styles/ActiveUsers.css';

const ActiveUsers = ({ users }) => {
  return (
    <div className="active-users-container">
      <div className="active-users-list">
      {users.length > 0 ? (
          users.map((user,index) => (
            <p key={index} className="active-user">{user.username}</p>
          ))
        ) : (
          <p className="no-active-users">No active users</p>
        )}
      </div>
    </div>
  );
};

export default ActiveUsers;
