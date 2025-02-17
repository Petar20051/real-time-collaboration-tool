import React from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css"; // Import the CSS file

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <header className="home-header">
        <div className="home-hero-content">
          <h1>Collaborate in Real-Time, Anywhere.</h1>
          <p>Edit documents, chat, share files, and host audio meetings—all in one place.</p>
          <Link to="/login">
            <button className="home-cta-button">Get Started</button>
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="home-container">
        <h2 className="home-section-title">Why Choose Us?</h2>
        <div className="home-content">
          <div className="home-card">
            <h3>🚀 Real-Time Editing</h3>
            <p>Edit documents with others in real-time and track changes instantly.</p>
          </div>
          <div className="home-card">
            <h3>💬 Live Chat</h3>
            <p>Communicate with team members seamlessly while working on documents.</p>
          </div>
          <div className="home-card">
            <h3>📁 File Sharing</h3>
            <p>Easily upload and share important files with your team.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="home-container">
        <h2 className="home-section-title">How It Works</h2>
        <div className="home-content">
          <div className="home-card">
            <h3>1️⃣ Enter a Room ID</h3>
            <p>Start by entering a room ID or creating a new one.</p>
          </div>
          <div className="home-card">
            <h3>2️⃣ Collaborate in Real-Time</h3>
            <p>Edit, chat, and share files with your team members.</p>
          </div>
          <div className="home-card">
            <h3>3️⃣ Save & Share Versions</h3>
            <p>Keep track of document versions and share progress easily.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="home-cta">
        <h2>Ready to Collaborate?</h2>
        <Link to="/login">
          <button className="home-cta-button">Get Started Now</button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Collaborative Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
