import React from 'react';
import styled from 'styled-components';

import puppy from '../images/puppy.png';
import { SpriteChat, ChatBubble } from './HelperChats';

const Puppy = styled.img`
  image-rendering: pixelated;
  width: 100px;

  @media only screen and (max-width: 600px) {
    width: 50px;
  }
`;

const PuppyChat = React.forwardRef(({ children, message, passRef }, ref) => (
  <SpriteChat ref={passRef} justify="flex-end">
    <ChatBubble direction="right" message={message}>
      {children}
    </ChatBubble>
    <Puppy src={puppy} alt="Puppy Sprite" />
  </SpriteChat>
));

export default PuppyChat;
