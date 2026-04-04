import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Body from "../components/Body";
import GiftContainer from "../components/gifts/GiftContainer";
import GiftFamilySelector from "../components/gifts/GiftFamilySelector";
import EmptyState from '../components/common/EmptyState';

export default function SearchGiftPage() {
  const { username } = useParams();
  const navigate = useNavigate();

  // Local state to manage selection before navigation (or direct navigation)
  const [selectedUser, setSelectedUser] = useState(username || '');

  const handleUserChange = (user) => {
    setSelectedUser(user);
    // Optional: update URL so they can bookmark it
    // navigate(`/search_gifts/${user}`);
  };

  return (
    <Body sidebar>
      <Container>

        {/* REUSABLE SELECTOR COMPONENT */}
        <GiftFamilySelector selectedUser={selectedUser} onSelect={handleUserChange} />

        {/* CONTENT AREA */}
        {selectedUser ? (
            <div className="animate-fade-in">
              <GiftContainer username={selectedUser} content="search"/>
            </div>
        ) : (
            <div className="mt-5">
                <EmptyState
                    title="Find a Wishlist"
                    message="Select a family member or friend above to see what they want for their next birthday!"
                    icon="bi-search"
                />
            </div>
        )}
      </Container>
    </Body>
  );
}
