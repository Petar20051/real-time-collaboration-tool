
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "../styles/AudioMeeting.css";

const SOCKET_SERVER_URL = "http://localhost:4000";

const AudioMeeting = ({ roomId }) => {
  const [socket, setSocket] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [users, setUsers] = useState([]);
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const localAudioRef = useRef();
  const peerConnections = useRef({});
  const [muteStates, setMuteStates] = useState({});
  const [stream, setStream] = useState(null);

  
  useEffect(() => {
    if (socket) return; 
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected:", newSocket.id);
      newSocket.emit("get-meeting-status", roomId);
    });

    newSocket.on("disconnect", (reason) => {
      console.error("❌ WebSocket disconnected:", reason);
    });

    newSocket.on("update-participants", ({ participants, muteStates: serverMuteStates }) => {
      console.log("🔄 Participants updated:", participants);
      setUsers(participants);
      setMuteStates((prev) => {
        const updated = { ...prev };
        participants.forEach((user) => {
          if (!(user in updated)) updated[user] = false;
        });
        return updated;
      });
      setIsJoined(participants.includes(newSocket.id));
    });

    newSocket.on("user-muted", ({ userId, isMuted }) => {
      console.log(`🔇 User ${userId} mute state changed: ${isMuted}`);
      setMuteStates((prev) => ({ ...prev, [userId]: isMuted }));
    });

    newSocket.on("meeting-ended", () => {
      console.log("🛑 Meeting ended");
      setIsMeetingStarted(false);
      setIsJoined(false);
      setUsers([]);
      stopMicrophone();
    });

    newSocket.on("user-left-audio", (userId) => {
      console.log(`User left: ${userId}`);
      setUsers((prev) => prev.filter((id) => id !== userId));
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
    });

    newSocket.on("meeting-started", () => {
      console.log("✅ Meeting started (received from server)");
      setIsMeetingStarted(true);
     
    });

    
    newSocket.on("webrtc-offer", async ({ offer, from }) => {
      console.log(`Received WebRTC offer from ${from}`);
      const peer = createPeerConnection(from, newSocket);
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      newSocket.emit("webrtc-answer", { answer, to: from });
    });

    newSocket.on("webrtc-answer", ({ answer, from }) => {
      console.log(`Received WebRTC answer from ${from}`);
      const peer = peerConnections.current[from];
      if (!peer) return;
      peer.setRemoteDescription(answer).catch((err) => console.error("❌ Failed to set remote answer:", err));
    });

    newSocket.on("webrtc-candidate", ({ candidate, from }) => {
      console.log(`Received ICE candidate from ${from}`);
      const peer = peerConnections.current[from];
      if (peer) {
        peer.addIceCandidate(candidate);
      }
    });

    newSocket.on("request-microphone", () => {
      enableMicrophone();
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);


  useEffect(() => {
    if (!socket) return;
    const handleMicRequest = () => {
      enableMicrophone();
    };
    socket.on("request-microphone", handleMicRequest);
    return () => {
      socket && socket.off("request-microphone", handleMicRequest);
    };
  }, [socket]);

 
  const enableMicrophone = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localAudioRef.current.srcObject = userStream;
      setStream(userStream);
      console.log("🎙️ Microphone activated.");
    } catch (err) {
      console.error("❌ Microphone access denied:", err);
    }
  };

  const stopMicrophone = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      localAudioRef.current.srcObject = null;
      console.log("🔇 Microphone deactivated.");
    }
  };

  
  const createPeerConnection = (userId, socket) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-candidate", { candidate: event.candidate, to: userId });
      }
    };

    peer.ontrack = (event) => {
      const audioElement = document.createElement("audio");
      audioElement.srcObject = event.streams[0];
      audioElement.autoplay = true;
      document.body.appendChild(audioElement);
    };

    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    } else {
      
      navigator.mediaDevices.getUserMedia({ audio: true }).then((userStream) => {
        localAudioRef.current.srcObject = userStream;
        setStream(userStream);
        userStream.getTracks().forEach((track) => peer.addTrack(track, userStream));
      });
    }
    peerConnections.current[userId] = peer;
    return peer;
  };

  
  const startCall = async () => {
    if (!socket || isMeetingStarted) return;
    setIsMeetingStarted(true);
    socket.emit("start-audio", roomId);
    joinCall();
  };

  const joinCall = () => {
    if (!socket) return;
    socket.emit("join-audio", roomId);
    setIsJoined(true);
    enableMicrophone();
  
   
    setUsers((prevUsers) => {
      if (!prevUsers.includes(socket.id)) {
        return [...prevUsers, socket.id];
      }
      return prevUsers;
    });
  };
  

  const leaveCall = () => {
    if (!socket) return;
    socket.emit("leave-audio", roomId);
    setIsJoined(false);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      localAudioRef.current.srcObject = null;
    }
    setUsers((prev) => prev.filter((user) => user !== socket.id));
    if (users.length === 1) {
      setIsMeetingStarted(false);
    }
  };

  const toggleMute = () => {
    if (!socket || !stream) return;
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !newMuteState;
    });
    setMuteStates((prev) => ({ ...prev, [socket.id]: newMuteState }));
    socket.emit("toggle-mute", { roomId, userId: socket.id, isMuted: newMuteState });
  };

  
  return (
    <div className="audio-meeting-container">
      {!isMeetingStarted ? (
        <button className="audio-btn start-btn" onClick={startCall}>
          🎙️ Start Audio Meeting
        </button>
      ) : !isJoined ? (
        <button className="audio-btn join-btn" onClick={joinCall}>
          🔊 Join Audio Meeting
        </button>
      ) : (
        <button className="audio-btn leave-btn" onClick={leaveCall}>
          🚪 Leave Audio Meeting
        </button>
      )}
      {isJoined && (
        <button className={`audio-btn mute-btn ${isMuted ? "muted" : ""}`} onClick={toggleMute}>
          {isMuted ? "🔇 Unmute" : "🎤 Mute"}
        </button>
      )}
      <p className="participants-title">Participants:</p>
      <ul className="participants-list">
        {users.map((user) => (
          <li key={user}>
            {user} {muteStates[user] ? "🔇" : "🎤"}
          </li>
        ))}
      </ul>
      <audio ref={localAudioRef} autoPlay muted />
    </div>
  );
};

export default AudioMeeting;
