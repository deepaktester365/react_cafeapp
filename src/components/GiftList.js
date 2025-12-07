import { useState, useEffect } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { useApi } from '../contexts/ApiProvider';
import Gift from './Gift';
import More from "./More";

export default function GiftList({userid, content = 'search'}) {
  const [gifts, setGifts] = useState();
  const [pagination, setPagination] = useState();
  const api = useApi();

  let url;
  switch (content) {
    case 'search':
      url = `/gift_list/${userid}`;
      break;
    case 'mine':
      url='/gifts';
      break;

  }

  useEffect(() => {
    (async () => {
      const response = await api.get(url);
      if (response.ok) {
        setGifts(response.body.items);
        setPagination(response.body._meta);
      }
      else {
        setGifts(null);
      }
    })();
  }, [api, url])

  const loadNextPage = async () => {
    const response = await api.get(url, {
      page: pagination.page + 1
    });

    if (response.ok) {
      setGifts([...gifts, ...response.body.items]);
      setPagination(response.body._meta);
    }
  };

  return (
    <>
      {gifts === undefined ?
        <Spinner animation="border" />
      :
        <>
          {gifts === null ?
            <p>Could not retrieve gift list.</p>
          :
            <>
              <Table striped bordered rounded hover>
                <thead className="table-success">
                  <tr>
                    <th>Gift Item</th>
                    <th>Price</th>
                    <th>Rating</th>
                    <th>Notes</th>
                    <th>Website</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts.length === 0 ?
                    <p>There are no gifts in this list!</p>
                  :
                    gifts.map(gift => <Gift key={gift.id} gift={gift} />)
                  }
                </tbody>
              </Table>
              <More pagination={pagination} loadNextPage={loadNextPage} />
            </>
          }
        </>
      }
    </>
  );
}


