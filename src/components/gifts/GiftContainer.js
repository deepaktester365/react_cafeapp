import { useState, useMemo } from 'react';
import { Card, Button } from 'react-bootstrap';

// Hooks
import usePaginatedApi from '../../hooks/usePaginatedApi';

// Components
import PageHeader from '../common/PageHeader';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import LoadMore from '../common/LoadMore';

import GiftRow from './GiftRow';
import GiftAddForm from "./GiftAddForm";
import GiftEditModal from "./GiftEditModal";
import GiftBuyerModal from "./GiftBuyerModal";

export default function GiftContainer({ username, content = 'search', write }) {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 1. Determine URL based on content mode
  let url;
  let title = "Wishlist";
  let icon = "bi-gift";

  switch (content) {
    case 'mine':
        url = '/gifts';
        title = "My Wishlist";
        break;
    case 'bought':
        url = `/gifts_bought`;
        title = "Bought Items";
        icon = "bi-bag-check";
        break;
    case 'search':
    default:
        url = `/gift_list/${username}`;
        title = `${username}'s Wishlist`;
        break;
  }

  // 2. Use Hook
  const { items: gifts, setItems, pagination, loadNextPage, refresh } = usePaginatedApi(url);

  // 3. Sorting Logic
  const sortedGifts = useMemo(() => {
    if (!gifts) return null;
    let sortableItems = [...gifts];

    if (sortConfig.key === null) {
         if (content === 'mine') {
             sortableItems.sort((a, b) => (a.archive_status === b.archive_status) ? 0 : a.archive_status ? 1 : -1);
         }
    }
    else {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null) aValue = "";
        if (bValue === null) bValue = "";

        if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
           aValue = parseFloat(aValue);
           bValue = parseFloat(bValue);
        } else {
           aValue = aValue.toString().toLowerCase();
           bValue = bValue.toString().toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [gifts, sortConfig, content]);

  const activeGifts = sortedGifts ? sortedGifts.filter(g => !g.archive_status) : [];
  const archivedGifts = sortedGifts ? sortedGifts.filter(g => g.archive_status) : [];

  const handleItemUpdate = (updatedItem) => {
    setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
    setSelectedItemId(null);
  };

  const handleItemArchive = () => {
    refresh();
    setSelectedItemId(null);
  };

  const showList = (newItem) => {
    setItems(prev => [newItem, ...prev]);
  };

  const SortButton = ({ label, sortKey }) => (
      <Button
        variant="link"
        className="text-decoration-none text-body-75 p-0 me-3 small"
        onClick={() => {
            let direction = 'asc';
            if (sortConfig.key === sortKey && sortConfig.direction === 'asc') direction = 'desc';
            setSortConfig({ key: sortKey, direction });
        }}
      >
        {label}
        {sortConfig.key === sortKey ? (
            <i className={`bi bi-sort-${sortConfig.direction === 'asc' ? 'down' : 'up'} ms-1 text-primary`}></i>
        ) : (
            <i className="bi bi-arrow-down-up ms-1 opacity-50"></i>
        )}
      </Button>
  );

  return (
    <>
      <PageHeader title={title} icon={icon} />

      <div className="container-fluid px-3 pb-5">
        {write && <GiftAddForm showList={showList} />}

        {gifts === undefined ? (
          <LoadingState message="Fetching gifts..." />
        ) : gifts === null ? (
          <EmptyState title="Error" message="Could not load list." icon="bi-exclamation-triangle" />
        ) : (
          <>
             {/* Sort Controls */}
             {gifts.length > 0 && (
                 <div className="d-flex justify-content-end mb-2 px-2">
                     <span className="text-body-75 small me-2">Sort by:</span>
                     <SortButton label="Name" sortKey="name" />
                     <SortButton label="Price" sortKey="price" />
                     <SortButton label="Rating" sortKey="rating" />
                 </div>
             )}

             {/* MAIN LIST CARD */}
             {activeGifts.length === 0 && archivedGifts.length === 0 ? (
                 <EmptyState title="No items found" message="This list is empty." icon="bi-gift" />
             ) : (
                 <>
                    {/* Active Items */}
                    {/* FIX: Added 'bg-surface' to force dark mode color */}
                    <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-surface">
                        <Card.Body className="p-0">
                            {activeGifts.length > 0 ? (
                                activeGifts.map((gift) => (
                                    <GiftRow
                                        key={gift.id}
                                        gift={gift}
                                        showArchiveStatus={false}
                                        showPurchaseStatus={content === 'search'}
                                        showBoughtStatus={content === 'bought'}
                                        onClick={() => setSelectedItemId(gift.id)}
                                    />
                                ))
                            ) : (
                                <div className="p-4 text-center text-body-75">No active items.</div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Archived Items */}
                    {archivedGifts.length > 0 && content !== 'search' && (
                        <div className="mt-5">
                            <h6 className="text-header-caps text-body-50 mb-3 ps-2">Archived / Past Items</h6>
                            {/* FIX: Added 'bg-surface' here too */}
                            <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-surface-75">
                                <Card.Body className="p-0">
                                    {archivedGifts.map((gift) => (
                                        <GiftRow
                                            key={gift.id}
                                            gift={gift}
                                            showArchiveStatus={true}
                                            showPurchaseStatus={false}
                                            showBoughtStatus={content === 'bought'}
                                            onClick={() => setSelectedItemId(gift.id)}
                                        />
                                    ))}
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                 </>
             )}

             <div className="mb-5">
                <LoadMore pagination={pagination} loadNextPage={loadNextPage} />
             </div>
          </>
        )}
      </div>

      {content === 'mine' && (
          <GiftEditModal
            itemId={selectedItemId}
            show={!!selectedItemId}
            handleClose={() => setSelectedItemId(null)}
            onUpdate={handleItemUpdate}
            onArchive={handleItemArchive}
          />
      )}
      {(content === 'search' || content === 'bought') && (
          <GiftBuyerModal
            itemId={selectedItemId}
            show={!!selectedItemId}
            handleClose={() => setSelectedItemId(null)}
            onUpdate={handleItemUpdate}
          />
      )}
    </>
  );
}
