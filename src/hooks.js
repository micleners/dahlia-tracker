import { useState, useRef, useEffect } from 'react';

export const useDialogDelay = (delay) => {
  const [showHuman, setShowHuman] = useState(false);
  const myRef1 = useRef(null);
  const myRef2 = useRef(null);

  useEffect(() => {
    executeScroll();
  });

  const executeScroll = () => {
    if (myRef1.current) {
      myRef1.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (myRef2.current) {
      myRef2 && myRef2.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  setTimeout(() => {
    setShowHuman(true);
  }, delay);

  return [myRef1, myRef2, showHuman];
};
