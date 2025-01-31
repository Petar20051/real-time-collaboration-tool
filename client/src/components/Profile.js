// src/components/Profile.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card} from 'react-bootstrap';

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
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header className="text-center">
              <h2>Username :</h2>
              <h3 className="mt-3">{profileData.username}</h3>
            </Card.Header>
            <Card.Body>
              <Col>
                <Row >
                  <p><strong>Email :</strong> {profileData.email}</p>
                </Row>
                <Row >
                  <p><strong>Role :</strong> {profileData.role}</p>
                </Row>
              </Col>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
