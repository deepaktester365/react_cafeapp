import { useState, useEffect } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import { useUser } from '../../contexts/UserProvider';

export default function GiftFamilySelector({ selectedUser, onSelect }) {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const { user: currentUser } = useUser();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const response = await api.get('/gifts_family');
      if (isMounted) {
        if (response.ok) {
          setUsers(processFamilyData(response.body));
        } else {
          setUsers([]);
        }
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [api]);

  // Helper to flatten the API response into a sorted list of names
  const processFamilyData = (data) => {
    if (!data || !data['Gift']) return [];

    const names = new Set();
    const giftFamilies = data['Gift'];

    Object.values(giftFamilies).forEach(members => {
      members.forEach(member => {
          if (member.username !== currentUser?.username) {
              names.add(member.username);
          }
      });
    });

    return [...names].sort();
  };

  if (loading) return <Spinner animation="border" size="sm" variant="primary" />;

  return (
    // FIX 1: Replaced 'bg-white' with 'bg-surface' so it adapts to Dark Mode
    <div className="bg-surface p-4 rounded-4 shadow-sm border mb-4">
        <Form.Group>
            <Form.Label className="text-header-caps text-primary mb-2">Find a Wishlist</Form.Label>
            <Form.Select
                value={selectedUser}
                onChange={(e) => onSelect(e.target.value)}
                // FIX 2: Removed 'border-secondary-subtle'.
                // We let our global CSS handle the border color so it turns dark automatically.
                className="form-select-lg rounded-3"
                style={{fontSize: '1rem'}}
            >
                <option value="">-- Select a Family Member --</option>
                {users && users.map(name => (
                    <option key={name} value={name}>{name}</option>
                ))}
            </Form.Select>
            <Form.Text className="text-muted mt-2 d-block">
                View wishlists for people in your groups.
            </Form.Text>
        </Form.Group>
    </div>
  );
}
