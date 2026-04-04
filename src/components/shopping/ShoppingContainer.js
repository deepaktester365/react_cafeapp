import { useState, useEffect, Fragment } from 'react';
import { Card } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';

// --- NOOK DESIGN SYSTEM IMPORTS ---
import PageHeader from '../common/PageHeader';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import LoadMore from '../common/LoadMore';

// Legacy components
import ShoppingRow from './ShoppingRow';
import ShoppingAddForm from "./ShoppingAddForm";
import ShoppingCheckoutCard from "./ShoppingCheckoutCard"; // Ensure this matches your file name (ShoppingPurchase?)
import ShoppingEditModal from "./ShoppingEditModal";

export default function ShoppingContainer({ content = 'search', write }) {
  const [shopping, setShopping] = useState();
  const [pagination, setPagination] = useState();
  const [total, setTotal] = useState();
  const [selectedItemId, setSelectedItemId] = useState(null);

  const api = useApi();
  let url = `/shopping`;

  // --- HELPER: Sorting Logic ---
  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      const catA = (a.category || "Uncategorized").toLowerCase();
      const catB = (b.category || "Uncategorized").toLowerCase();

      // 1. Sort by Category
      if (catA < catB) return -1;
      if (catA > catB) return 1;

      // 2. Sort by Name
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  // 1. Load Data
  const loadData = async () => {
    const response = await api.get(url);
    if (response.ok) {
      setShopping(response.body.items);
      setPagination(response.body._meta);
      setTotal(response.body.total_price);
    } else {
      setShopping(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [api, url]);

  const loadNextPage = async () => {
    const response = await api.get(url, { page: pagination.page + 1 });
    if (response.ok) {
      setShopping([...shopping, ...response.body.items]);
      setPagination(response.body._meta);
    }
  };

  // 2. Handlers
  const handleItemDelete = (deletedId) => {
    const itemToRemove = shopping.find(i => i.id === deletedId);
    setShopping(prevItems => prevItems.filter(item => item.id !== deletedId));
    if (itemToRemove && itemToRemove.purchase_status) {
      const deduction = (itemToRemove.unit_price || 0) * (itemToRemove.qty || 1);
      setTotal(prev => Math.round((prev - deduction) * 100) / 100);
    }
  };

  const handleItemUpdate = (updatedItem) => {
    const oldItem = shopping.find(i => i.id === updatedItem.id);
    if (oldItem) {
      const oldCost = oldItem.purchase_status ? (oldItem.unit_price || 0) * (oldItem.qty || 1) : 0;
      const newCost = updatedItem.purchase_status ? (updatedItem.unit_price || 0) * (updatedItem.qty || 1) : 0;

      const difference = newCost - oldCost;
      if (difference !== 0) {
        setTotal(prev => Math.round((prev + difference) * 100) / 100);
      }
    }
    setShopping(prevItems => {
        const newList = prevItems.map(item => item.id === updatedItem.id ? updatedItem : item);
        return sortItems(newList);
    });
  };

  const showList = (newItem) => {
    setShopping(prevItems => {
      const updatedList = [newItem, ...(prevItems || [])];
      return sortItems(updatedList);
    });
  };

  return (
    <>
      <PageHeader
        title="Grocery List"
        icon="bi-cart3"
      />

      <div className="container-fluid px-3 pb-5">
        {/* Input Form */}
        {write && (
          <div className="mb-4">
            <ShoppingAddForm showList={showList} />
          </div>
        )}

        {/* 2. MAIN CONTENT AREA */}
        {shopping === undefined ? (
          <LoadingState message="Fetching your list..." />
        ) : shopping === null ? (
          <EmptyState title="Error" message="Could not retrieve shopping list." icon="bi-exclamation-triangle" />
        ) : (
          <>
            {shopping.length === 0 ? (
              <EmptyState
                title="Your list is empty"
                message="Start adding items above to plan your shopping trip."
                icon="bi-basket"
              />
            ) : (
              // Card automatically handles Dark Mode via CSS overrides
              <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                <Card.Body className="p-0">
                  {shopping.map((item, index) => {
                    const previousItem = shopping[index - 1];
                    const showHeader = index === 0 || item.category !== previousItem.category;
                    const categoryName = item.category || "Uncategorized";

                    return (
                      <Fragment key={item.id}>
                        {showHeader && (
                          // FIX: 'bg-light' is mapped to Dark Gray in CSS, so this works perfectly now.
                          <div className="bg-surface p-2 px-3 border-bottom border-top mt-0">
                            <span className="text-info">{categoryName}</span>
                          </div>
                        )}
                        <div className="px-3 py-1 border-bottom-dashed">
                          <ShoppingRow
                            item={item}
                            onUpdate={handleItemUpdate}
                            onEdit={() => setSelectedItemId(item.id)}
                          />
                        </div>
                      </Fragment>
                    );
                  })}
                </Card.Body>
              </Card>
            )}

            <div className="mb-5">
              <LoadMore pagination={pagination} loadNextPage={loadNextPage} />
            </div>
          </>
        )}

        {/* Purchase "Finish" Action */}
        {write && <div className="mt-4"><ShoppingCheckoutCard onComplete={loadData} /></div>}

      </div>

      {/* 3. STICKY FOOTER (TOTAL) */}
      {total !== undefined && (
        <div
          // FIX: Replaced 'bg-white' (or bg-body) with 'bg-surface'
          className="d-flex justify-content-between align-items-center bg-surface px-4 py-3 shadow border-top"
          style={{ position: 'sticky', bottom: 0, zIndex: 1000 }}
        >
          <span className="text-header-caps text-body-75 mb-0" style={{fontSize: '0.85rem'}}>Estimated Total</span>
          <h3 className="mb-0 text-success fw-bold text-currency">
            ${total.toFixed(2)}
          </h3>
        </div>
      )}

      <ShoppingEditModal
        itemId={selectedItemId}
        show={!!selectedItemId}
        handleClose={() => setSelectedItemId(null)}
        onUpdate={handleItemUpdate}
        onDelete={handleItemDelete}
      />
    </>
  );
}
