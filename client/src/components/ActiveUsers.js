import React from 'react';
import '../styles/ActiveUsers.css';

const ActiveUsers = ({ users }) => {
  return (
    <div className="active-users-container">
      <h3 className="active-users-title">Active Users</h3>
      <div className="active-users-list">
        {users.map((user, index) => (
          <p key={index} className="active-user">{user}</p>
        ))}
      </div>
    </div>
  );
};

export default ActiveUsers;
