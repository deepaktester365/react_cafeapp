import { useState, useEffect, Fragment } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { Badge, Card } from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import Shopping from './Shopping';
import More from "./More";
import ShoppingWrite from "./ShoppingWrite";
import ShoppingPurchase from "./ShoppingPurchase";

export default function ShoppingList({content = 'search', write}) {
  const [shopping, setShopping] = useState();
  const [pagination, setPagination] = useState();
  const api = useApi();

  let url;
  switch (content) {
    case 'search':
      url = `/shopping`;
      break;
    default:
      url = `/shopping`;
      break;
  }

  useEffect(() => {
    (async () => {
      const response = await api.get(url);
      if (response.ok) {
        setShopping(response.body.items);
        setPagination(response.body._meta);
      } else {
        setShopping(null);
      }
    })();
  }, [api, url])

  const loadNextPage = async () => {
    const response = await api.get(url, {
      page: pagination.page + 1
    });

    if (response.ok) {
      setShopping([...shopping, ...response.body.items]);
      setPagination(response.body._meta);
    }
  };

  const handleItemUpdate = (updatedItem) => {
    setShopping(prevItems =>
      prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  };

  const showList = (newItem) => {
    setShopping([newItem, ...shopping]);
  }

  return (
    <>
      {write && <ShoppingWrite showList={showList}/>}
      {shopping === undefined ?
        <div className="text-center mt-5"><Spinner animation="border" /></div>
      :
        <>
          {shopping === null ?
            <p>Could not retrieve gift list.</p>
          :
            <Card className="shadow-sm border-0 mt-3">
              <Card.Body className="p-0">

                {shopping.length === 0 ?
                  <div className="p-4 text-center">There are no items in this list!</div>
                :
                  shopping.map((item, index) => {
                    const previousItem = shopping[index-1];
                    const showHeader = index === 0 || item.category !== previousItem.category;
                    const categoryName = item.category || "Uncategorized"

                    return (
                      <Fragment key={item.id}>
                        {showHeader && (
                          <div className="bg-light p-2 px-3 fw-bold text-uppercase small text-secondary border-bottom border-top">
                            {categoryName}
                          </div>
                        )}
                        <div className="px-3">
                           <Shopping
                             item={item}
                             onUpdate={handleItemUpdate}
                           />
                        </div>
                      </Fragment>
                    );
                  })
                }
              </Card.Body>
            </Card>
          }
          <div className="mt-3">
            <More pagination={pagination} loadNextPage={loadNextPage} />
          </div>
        </>
      }
      {write && <ShoppingPurchase showList={showList}/>}
    </>
  );
}


