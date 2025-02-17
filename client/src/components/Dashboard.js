import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/stats');
        setStats(response.data);
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard-page">
      <Container fluid className="dashboard-container">
        <Row className="dashboard-header">
          <Col>
            <h2>📊 Dashboard Overview</h2>
          </Col>
        </Row>

        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <Row className="dashboard-content">
            <Col md={4} className="dashboard-card-container">
              <Card className="dashboard-card">
                <Card.Body>
                  <Card.Title>👥 Total Users</Card.Title>
                  <Card.Text>{stats?.totalUsers || 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="dashboard-card-container">
              <Card className="dashboard-card">
                <Card.Body>
                  <Card.Title>📄 Total Documents</Card.Title>
                  <Card.Text>{stats?.documentsCreated || 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="dashboard-card-container">
              <Card className="dashboard-card">
                <Card.Body>
                  <Card.Title>🔒 Private Documents</Card.Title>
                  <Card.Text>{stats?.privateDocuments || 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="dashboard-card-container">
              <Card className="dashboard-card">
                <Card.Body>
                  <Card.Title>🌍 Public Documents</Card.Title>
                  <Card.Text>{stats?.publicDocuments || 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="dashboard-card-container">
              <Card className="dashboard-card">
                <Card.Body>
                  <Card.Title>🕒 Docs with Versions</Card.Title>
                  <Card.Text>{stats?.docsWithVersions || 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Dashboard;
