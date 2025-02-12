import React, { useState, useEffect } from "react";
import axios from "axios";

const PasswordManager = ({ roomId, isOwner, requiresPassword, setIsOwner, setRequiresPassword }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await axios.get(`http://localhost:4000/api/documents/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.passwordHash) {
        setRequiresPassword(true);
        setIsOwner(response.data.ownerId === JSON.parse(atob(token.split(".")[1])).id);
      } else {
        setRequiresPassword(false);
      }
    } catch (error) {
      console.error("❌ Error fetching room details:", error.response?.data || error.message);
    }
  };

  const handleSetPassword = async () => {
    if (!password.trim()) {
      alert("Please enter a password.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `http://localhost:4000/api/documents/${roomId}/set-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Password set successfully!");
      setIsOwner(true);
      setRequiresPassword(true);
      setPassword("");
    } catch (error) {
      console.error("❌ Error setting password:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `http://localhost:4000/api/documents/${roomId}/remove-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Password removed!");
      setIsOwner(false);
      setRequiresPassword(false);
    } catch (error) {
      console.error("❌ Error removing password:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-manager">
      <h3>🔐 Room Security</h3>

      {requiresPassword ? (
        isOwner ? (
          <>
            <p>This room is protected. You can remove the password.</p>
            <button onClick={handleRemovePassword} className="remove-password-btn" disabled={loading}>
              {loading ? "Removing..." : "Remove Password"}
            </button>
          </>
        ) : (
          <p>This room is protected. Only the owner can manage passwords.</p>
        )
      ) : (
        <>
          <p>This room has no password. You can set one.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="password-input"
          />
          <button onClick={handleSetPassword} className="set-password-btn" disabled={loading}>
            {loading ? "Setting..." : "Set Password"}
          </button>
        </>
      )}
    </div>
  );
};

export default PasswordManager;
