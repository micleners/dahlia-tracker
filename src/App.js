import styled from 'styled-components';
import { useRef, useEffect, useState } from 'react';

import PuppyChat from './components/PuppyChat';
import HumanChat from './components/HumanChat';

import './style.css';
import 'nes.css/css/nes.min.css';
import Dialog1 from './components/Dialog1';
import Dialog2 from './components/Dialog2';
import RecentActivity from './components/RecentActivity';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 600px;
  margin: auto;
  height: 100%;
`;

const MealLog = () => {
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
  }, 500);

  return (
    <>
      <p></p>
      <PuppyChat passRef={myRef1} message="Food?!" />
      {showHuman && (
        <HumanChat message="You always love a meal (:">
          <textarea id="textarea_field" className="nes-textarea"></textarea>
          <button
            type="button"
            className="nes-btn is-primary"
            style={{ float: 'right' }}
            ref={myRef2}
          >
            Log
          </button>
        </HumanChat>
      )}
    </>
  );
};

const PeePoo = () => {
  return (
    <>
      <PuppyChat message="Sniff Sniff! Where done it?" />
      <HumanChat message="You always love a meal (:">
        <textarea id="textarea_field" className="nes-textarea"></textarea>
        <button
          type="button"
          className="nes-btn is-primary"
          style={{ float: 'right' }}
        >
          Log
        </button>
      </HumanChat>
    </>
  );
};

const Nap = () => {
  return (
    <>
      <PuppyChat message="Sniff Sniff! Where done it?" />
      <HumanChat message="You always love a meal (:">
        <textarea id="textarea_field" className="nes-textarea"></textarea>
        <button
          type="button"
          className="nes-btn is-primary"
          style={{ float: 'right' }}
        >
          Log
        </button>
      </HumanChat>
    </>
  );
};

const Other = () => {
  return (
    <>
      <PuppyChat message="Sniff Sniff! Where done it?" />
      <HumanChat message="You always love a meal...">
        <textarea id="textarea_field" className="nes-textarea"></textarea>
        <button
          type="button"
          className="nes-btn is-primary"
          style={{ float: 'right' }}
        >
          Log
        </button>
      </HumanChat>
    </>
  );
};

function App() {
  const [optionSelected, setOptionSelected] = useState('');

  return (
    <Container className="App">
      <RecentActivity />
      <Dialog1
        optionSelected={optionSelected}
        setOptionSelected={setOptionSelected}
      />
      {optionSelected && <Dialog2 optionSelected={optionSelected} />}
    </Container>
  );
}

export default App;
