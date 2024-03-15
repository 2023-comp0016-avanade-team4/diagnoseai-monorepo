// Credit: https://stackoverflow.com/a/57706747

import { useEffect, useRef } from 'react';

export const usePrevious = <T>(value: T): { 'current': T, 'previous': T | undefined } => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return { 'current': value, 'previous': ref.current };
}
