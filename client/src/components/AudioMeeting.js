import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "../styles/AudioMeeting.css"; // Import styles

const SOCKET_SERVER_URL = "http://localhost:4000"; // Ensure this is correct

const AudioMeeting = ({ roomId }) => {
  const [socket, setSocket] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [users, setUsers] = useState([]);
  const [isMeetingStarted, setIsMeetingStarted] = useState(false); // ✅ Track meeting state
  const [isJoined, setIsJoined] = useState(false); // ✅ Track if user is in the meeting
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
    });
  
    newSocket.on("disconnect", (reason) => {
      console.error("❌ WebSocket disconnected:", reason);
    });

    setIsMeetingStarted(false);

    
    newSocket.on("update-participants", ({ participants, muteStates }) => {
      console.log("🔄 Participants updated:", participants);
      
      setUsers(participants);
      
      setMuteStates((prevMuteStates) => {
        const updatedMuteStates = { ...prevMuteStates };
        participants.forEach((user) => {
          if (!(user in updatedMuteStates)) {
            updatedMuteStates[user] = false; // ✅ Ensures new users are NOT muted
          }
        });
        return updatedMuteStates;
      });
      
      // ✅ Unmute user on joining
      if (socket && socket.id && muteStates[socket.id] === undefined) {
        setMuteStates((prev) => ({ ...prev, [socket.id]: false }));
      }
      
    
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
      stopMicrophone(); // ✅ Clear participant list
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
      let peer = createPeerConnection(from, newSocket);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      newSocket.emit("webrtc-answer", { answer, to: from });
    });

    

    newSocket.on("webrtc-answer", ({ answer, from }) => {
      const peer = peerConnections.current[from];
      if (!peer) return;
    
      if (peer.signalingState === "stable") return; // ✅ Prevent invalid state errors
    
      console.log(`✅ Setting remote answer from ${from}`);
      peer.setRemoteDescription(new RTCSessionDescription(answer)).catch((err) => {
        console.error("❌ Failed to set remote answer:", err);
      });
    });
    
    newSocket.on("request-microphone", () => {
      enableMicrophone();
    });

    newSocket.on("webrtc-candidate", ({ candidate, from }) => {
      const peer = peerConnections.current[from];
      if (peer) {
        peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      if (socket) {
        console.log("🛑 Closing WebSocket connection...");
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return; 
  
    const handleMicRequest = () => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          localAudioRef.current.srcObject = stream;
          console.log("🎙️ Microphone activated.");
        })
        .catch((err) => console.error("❌ Microphone access denied:", err));
    };
  
    socket.on("request-microphone", handleMicRequest);
  
    return () => {
      if (socket) {
        socket.off("request-microphone", handleMicRequest); 
      }
    };
  }, [socket]); 

  const enableMicrophone = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localAudioRef.current.srcObject = userStream;
      setStream(userStream); // ✅ Save stream reference
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

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localAudioRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    });

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
    if (!socket || !isMeetingStarted) return;
    socket.emit("join-audio", roomId);
    setIsJoined(true);
    enableMicrophone();
  
    // ✅ Ensure mic access is requested
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        localAudioRef.current.srcObject = stream;
      })
      .catch((err) => console.error("❌ Microphone access denied:", err));
  };
  

  const leaveCall = () => {
    if (!socket) return;
  
    socket.emit("leave-audio", roomId);
    setIsJoined(false);
  
    // ✅ Stop the microphone completely
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      localAudioRef.current.srcObject = null;
    }
  
    setUsers((prev) => prev.filter((user) => user !== socket.id));
  
    // ✅ If last user leaves, reset the meeting state
    if (users.length === 1) {
      setIsMeetingStarted(false);
    }
  };
  
  
  
  
  

  const toggleMute = () => {
    if (!socket || !stream) return;
  
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
  
    // ✅ Instead of stopping, disable the audio track instantly
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !newMuteState;
    });
  
    // ✅ Update mute state on UI & send to server
    setMuteStates((prev) => ({
      ...prev,
      [socket.id]: newMuteState,
    }));
  
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
