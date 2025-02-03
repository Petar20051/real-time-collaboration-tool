import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../styles/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <Container fluid className="dashboard-container">
        <Row className="dashboard-header">
          <Col>
            <h2>Welcome to your Dashboard</h2>
          </Col>
        </Row>
        <Row className="dashboard-content">
          <Col md={4} className="dashboard-card-container">
            <Card className="dashboard-card">
              <Card.Body>
                <Card.Title>Card Title 1</Card.Title>
                <Card.Text>
                  Some quick example text to build on the card title and make up the bulk of the card's content.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="dashboard-card-container">
            <Card className="dashboard-card">
              <Card.Body>
                <Card.Title>Card Title 2</Card.Title>
                <Card.Text>
                  Some quick example text to build on the card title and make up the bulk of the card's content.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="dashboard-card-container">
            <Card className="dashboard-card">
              <Card.Body>
                <Card.Title>Card Title 3</Card.Title>
                <Card.Text>
                  Some quick example text to build on the card title and make up the bulk of the card's content.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;
