import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Redirect to settings
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import '../styles/Profile.css';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/user/profile', {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
      }
    };

    if (auth?.token) {
      fetchProfile();
    }
  }, [auth]);

  if (!profileData) {
    return <div className="loading">Loading...</div>;
  }

  // Fix date formatting
  const formattedDate = profileData.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString()
    : 'N/A';

  return (
    <Container className="profile-page">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="profile-card">
            <Card.Header className="profile-header">
              <h2>👤 {profileData.username}</h2>
            </Card.Header>
            <Card.Body>
              <div className="profile-info">
                <p><strong>Email:</strong> {profileData.email}</p>
                <p><strong>Role:</strong> {profileData.role}</p>
                <p><strong>Joined:</strong> {formattedDate}</p>
              </div>
              <Button className="profile-edit-btn" onClick={() => navigate('/settings')}>
                ✏️ Edit Profile
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
