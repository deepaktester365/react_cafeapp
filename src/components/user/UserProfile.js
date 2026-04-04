import { Container, Row, Col, Card, Tab, Tabs, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Nook Components
import PageHeader from '../common/PageHeader';
import StatusBadge from '../common/StatusBadge';
import ChangePassword from "./ChangePassword";
import UserShoppingManagement from './UserShoppingManagement';

export default function UserProfile({ profile, group, isMe }) {

  // Helper to render the Avatar Circle
  const Avatar = ({ username, size = '100px', fontSize = '2.5rem' }) => (
    <div
      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-4 border-white"
      style={{ width: size, height: size, fontSize: fontSize }}
    >
      {username ? username[0].toUpperCase() : '?'}
    </div>
  );

  return (
    <>
      <PageHeader title={isMe ? "My Profile" : `${profile.username}'s Profile`} icon="bi-person-circle" />

      <Container fluid className="px-4 pb-5">

        {/* --- HERO CARD --- */}
        <Card className="shadow-sm border-0 mb-4 bg-surface rounded-4">
          <div className="bg-info opacity-25 rounded-top-4" style={{height: '100px'}}></div>

          <Card.Body className="p-4">
             <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                {/* Avatar container */}
                <div className="position-relative" style={{ marginTop: '-60px' }}>
                    <Avatar username={profile.username} />
                </div>

                <div className="text-center text-md-start">
                    <h2 className="fw-bold mb-1">{profile.username}</h2>
                    {profile.email && (
                        <div className="text-body-50 mb-2 small">
                            <i className="bi bi-envelope me-2"></i>{profile.email}
                        </div>
                    )}
                    <div className="d-flex gap-2 justify-content-center justify-content-md-start">
                        {isMe && <StatusBadge variant="success" label="It's You!" icon="bi-check2" />}
                        {/* FIX: Changed from 'light' to 'secondary' for visibility in Light Mode */}
                        <StatusBadge variant="secondary" label="Member" />
                    </div>
                </div>
             </div>
          </Card.Body>
        </Card>

        {/* --- TABS --- */}
        <Tabs defaultActiveKey="overview" className="mb-4 border-bottom-0 custom-tabs" variant="pills">

          {/* TAB 1: OVERVIEW (Stats) */}
          <Tab eventKey="overview" title="Overview">
            <Row>
                <Col md={6}>
                    <Card className="shadow-sm border-0 h-100 rounded-4 bg-surface">
                        <Card.Header className="bg-transparent border-0 pt-4 px-4">
                            <h6 className="text-header-caps mb-0">Activity Stats</h6>
                        </Card.Header>
                        <Card.Body className="px-4 pb-4">
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-transparent border-0 px-0 py-3">
                                    <span className="text-body-50"><i className="bi bi-people me-2"></i>Groups Joined</span>
                                    <span className="fs-5 fw-bold text-primary">{profile.groups_count || 0}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-transparent border-top px-0 py-3">
                                    <span className="text-body-50"><i className="bi bi-gift me-2"></i>Wishlist Items</span>
                                    <span className="fs-5 fw-bold text-primary">{profile.gifts_count || 0}</span>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
          </Tab>

          {/* TAB 2: SHOPPING */}
          {isMe && (
            <Tab eventKey="shopping" title="Shopping">
                 <UserShoppingManagement />
            </Tab>
          )}

          {/* TAB 3: GROUPS (Only visible to owner) */}
          {isMe && (
            <Tab eventKey="groups" title="Groups">
              <Row>
                  <Col md={8}>
                      <Card className="shadow-sm border-0 h-100 rounded-4 bg-surface">
                          <Card.Header className="bg-transparent border-0 pt-4 px-4">
                              <h6 className="text-header-caps mb-0">My Families</h6>
                          </Card.Header>
                          <Card.Body className="p-4">
                            {group ? (
                              <div className="d-flex flex-column gap-4">
                                {Object.entries(group).map(([familyType, families]) => (
                                  <div key={familyType}>
                                    <div className="text-header-caps text-primary mb-2 border-bottom pb-1">
                                      {familyType}
                                    </div>
                                    <div className="d-flex flex-column gap-2">
                                        {Object.entries(families).map(([familyName, members]) => (
                                            <div key={familyName} className="p-3 bg-transparent rounded-3 border border-secondary-subtle">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="fw-bold text-body">{familyName}</span>
                                                    <StatusBadge variant="secondary" label={`${members.length} Members`} />
                                                </div>
                                                <div className="small text-body text-truncate opacity-75">
                                                    {members.map((m, index) => (
                                                        <span key={m.id || index}>
                                                            <Link to={`/user/${m.username}`} className="text-decoration-none fw-medium text-body hover-text-primary">
                                                                {m.username}
                                                            </Link>
                                                            {index < members.length - 1 && ", "}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-secondary text-center py-4">Loading groups...</div>
                            )}
                          </Card.Body>
                      </Card>
                  </Col>
              </Row>
            </Tab>
          )}

          {/* TAB 4: SETTINGS */}
          {isMe && (
            <Tab eventKey="settings" title="Settings">
                <Row>
                    <Col md={6}>
                        <ChangePassword />
                    </Col>
                </Row>
            </Tab>
          )}

        </Tabs>
      </Container>
    </>
  );
}
