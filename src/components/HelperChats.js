import styled from 'styled-components';

export const SpriteChat = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: ${(props) => props.justify};
`;

export const ChatBubble = ({ direction, message, children }) => (
  <section
    className={`message -${direction}`}
    style={{ maxWidth: 500, alignSelf: 'flex-end' }}
  >
    <div className={`nes-balloon from-${direction}`}>
      <p>{message}</p>
      {children}
    </div>
  </section>
);
