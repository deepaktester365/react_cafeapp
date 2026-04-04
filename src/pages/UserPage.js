import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Body from "../components/Body";
import { useApi } from '../contexts/ApiProvider';
import { useUser } from '../contexts/UserProvider';

// Components
import UserProfile from '../components/user/UserProfile';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function UserPage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = useApi();
  const { user: currentUser } = useUser();
  const fam_url = `/gifts_family`;

  // 1. Fetch User Profile
  useEffect(() => {
    (async () => {
      setLoading(true);
      const response = await api.get(`/users/${username}`);
      if (response.ok) {
        setProfile(response.body);
      } else {
        setProfile(null);
      }
      setLoading(false);
    })();
  }, [api, username]);

  // 2. Fetch Groups (Only if needed, or we can fetch blindly)
  useEffect(() => {
    (async () => {
      const response = await api.get(fam_url);
      if (response.ok) {
        setGroup(response.body);
      } else {
        setGroup(null);
      }
    })();
  }, [api, fam_url]);

  // --- RENDER STATES ---

  if (loading) {
    return (
      <Body sidebar>
         <LoadingState message="Loading profile..." />
      </Body>
    );
  }

  if (!profile) {
    return (
      <Body sidebar>
        <EmptyState
            title="User not found"
            message={`The user "${username}" does not exist.`}
            icon="bi-person-x"
        />
      </Body>
    );
  }

  const isMe = currentUser && currentUser.username === profile.username;

  return (
    <Body sidebar>
      <UserProfile
        profile={profile}
        group={group}
        isMe={isMe}
      />
    </Body>
  );
}
