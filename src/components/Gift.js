import Stack from 'react-bootstrap/Stack';
import { Link } from 'react-router-dom';

export default function Gift({ gift }) {
  if (gift.archive_status) {
    return null;
  }

  return (
    <tr className="Gift">
      <td>
        <Link to={'/user/' + gift.user}>
          {gift.name}
        </Link>
      </td>
      <td>${gift.price}</td>
      <td>{gift.rating}</td>
      <td>{gift.notes}</td>
      <td>
        {gift.url ? (<Link to={gift.url}>{gift.url_loc}</Link>) : (
          <span className="text-muted">No link</span>)}
      </td>
    </tr>
  );
}
