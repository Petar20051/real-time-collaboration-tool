import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../styles/Profile.css';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const { auth } = useContext(AuthContext);

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
        console.error('Error fetching profile:', error);
      }
    };

    if (auth?.token) {
      fetchProfile();
    }
  }, [auth]);

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <Container fluid className="profile-page">
      <Row>
        <Col md={12}>
          <h2 className="profile-title">Profile</h2>
          <Card className="profile-card">
            <Card.Header>
              <h3>Username: {profileData.username}</h3>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Email:</strong> {profileData.email}
              </p>
              <p>
                <strong>Role:</strong> {profileData.role}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
