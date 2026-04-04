import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../contexts/ApiProvider';

export default function usePaginatedApi(url) {
  const [items, setItems] = useState();
  const [pagination, setPagination] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = useApi();

  // 1. Load Initial Data
  const loadData = useCallback(async () => {
    if (!url) return; // Guard against empty URLs
    setLoading(true);
    const response = await api.get(url);
    if (response.ok) {
      setItems(response.body.items);
      setPagination(response.body._meta);
      setError(null);
    } else {
      setItems(null);
      setError("Failed to load data");
    }
    setLoading(false);
  }, [api, url]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Load Next Page
  const loadNextPage = async () => {
    // FIX: logic updated to match your backend's _meta structure
    if (!pagination) return;
    if (pagination.page >= pagination.total_pages) return; // No more pages

    const response = await api.get(url, { page: pagination.page + 1 });
    if (response.ok) {
      setItems(prev => [...prev, ...response.body.items]);
      setPagination(response.body._meta);
    }
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (updatedItem) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const addItem = (newItem) => {
    setItems(prev => [newItem, ...prev]);
  };

  return {
    items,
    setItems,
    pagination,
    loading,
    error,
    loadNextPage,
    refresh: loadData,
    removeItem,
    updateItem,
    addItem
  };
}
