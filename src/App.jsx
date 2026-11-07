import styled from 'styled-components';
import { useRef, useEffect, useState } from 'react';

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
