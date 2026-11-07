import React from 'react';
import styled from 'styled-components';

import human from '../images/boy.png';
import { SpriteChat, ChatBubble } from './HelperChats';

const Human = styled.img`
  image-rendering: pixelated;
  width: 100px;

  @media only screen and (max-width: 600px) {
    width: 50px;
  }
`;

const HumanChat = React.forwardRef(({ children, message }, ref) => (
  <SpriteChat justify="flex-start">
    <Human src={human} alt="Puppy Sprite" />
    <ChatBubble direction="left" message={message}>
      {children}
    </ChatBubble>
    <span ref={ref} />
  </SpriteChat>
));

export default HumanChat;
