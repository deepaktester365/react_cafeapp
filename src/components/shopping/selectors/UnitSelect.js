import { useState, useEffect } from 'react';
import { useApi } from '../../../contexts/ApiProvider';
import InputField from '../../InputField';

let cachedUnits = null;

export default function UnitSelect({ label = "Unit", name = "unit", error, fieldRef, value, onChange, ...props }) {
  const [units, setUnits] = useState(cachedUnits || []);
  const api = useApi();

  useEffect(() => {
    if (cachedUnits) return;

    (async () => {
      const response = await api.get('/shopping/options');
      if (response.ok) {
        cachedUnits = response.body.units;
        setUnits(cachedUnits);
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
      {units.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </InputField>
  );
}
