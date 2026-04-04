import { useState, useEffect } from 'react';
import { useApi } from '../../../contexts/ApiProvider'; // Adjust path based on your folder structure
import InputField from '../../InputField'; // Adjust path to your InputField

// Simple cache to prevent refetching every time you open a modal
let cachedCategories = null;

export default function CategorySelect({ label = "Category", name = "category", error, fieldRef, value, onChange, ...props }) {
  const [categories, setCategories] = useState(cachedCategories || []);
  const api = useApi();

  useEffect(() => {
    if (cachedCategories) return; // Use cache if available

    (async () => {
      const response = await api.get('/shopping/options');
      if (response.ok) {
        cachedCategories = response.body.categories;
        setCategories(cachedCategories);
      }
    })();
  }, [api]);

  return (
    <InputField
      type="select"
      label={label}
      name={name}
      error={error}
      fieldRef={fieldRef}
      value={value}
      onChange={onChange}
      {...props}
    >
      {/* Default Option */}
      {!value && <option value="Uncategorized">Select Category...</option>}
      
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </InputField>
  );
}
