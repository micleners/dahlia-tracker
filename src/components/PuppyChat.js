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

const PuppyChat = React.forwardRef(({ children, message }, ref) => (
  <SpriteChat justify="flex-end">
    <ChatBubble direction="right" message={message}>
      {children}
    </ChatBubble>
    <Puppy src={puppy} alt="Puppy Sprite" />
    <span ref={ref} />
  </SpriteChat>
));

export default PuppyChat;
