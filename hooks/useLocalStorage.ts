// FIX: Import 'React' to make the 'React' namespace available for type annotations.
import React, { useState, useEffect } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T, prefix?: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const finalKey = prefix ? `${prefix}_${key}` : key;
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(finalKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(finalKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  
  useEffect(() => {
    try {
        const item = window.localStorage.getItem(finalKey);
        if (item) {
            setStoredValue(JSON.parse(item));
        } else {
            setStoredValue(initialValue);
        }
    } catch(e) {
        console.error(e)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalKey]);

  return [storedValue, setValue];
}

export default useLocalStorage;