import { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  text-align: center;

  .emoji {
    font-size: 20px;
  }
`;

const ColorClose = styled.div`
  .close::before {
    color: ${(props) => props.color};
  }
`;

const Ex = () => <i className="nes-icon close is-small"></i>;

const RedEx = () => (
  <ColorClose color="rgb(218 73 72)">
    <Ex />
  </ColorClose>
);

const YellowEx = () => (
  <ColorClose color="#ffce00">
    <Ex />
  </ColorClose>
);

const BrownEx = () => (
  <ColorClose color="rgb(91 54 30)">
    <Ex />
  </ColorClose>
);

const RecentActivity = () => {
  const [isOpen, setIsOpen] = useState(false);
  // console.log('outer: ', showRecent);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <Container onClick={toggle}>
      <div style={{ margin: 20 }}>{isOpen ? 'Hide' : 'Show'} Recent</div>
      {isOpen ? (
        <>
          {/* <div classNameName="lists">
            <Row>
              <span>Time</span>
              <span>Accident?</span>
              <span>Pee?</span>
              <span>Time?</span>
            </Row>
            <Row>
              <span classNameName="time">4:32 pm</span>
              <span>🔴</span>
              <span>💧</span>
              <span> </span>
            </Row>
            <Row>
              <span classNameName="time">5:52 pm</span>
              <span>🟢</span>
              <span></span>
              <span>💩</span>
            </Row>
            <Row>
              <span classNameName="time">7:32 pm</span>
              <span>🟢</span>
              <span>💧</span>
              <span> </span>
            </Row>
            <br />
          </div> */}
          <div
            style={{ margin: '20px 0 40px 0' }}
            className="nes-table-responsive"
          >
            <table
              className="nes-table is-bordered is-centered"
              style={{ margin: '10px auto' }}
            >
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Accident</th>
                  <th style={{ width: 90 }}>Pee</th>
                  <th style={{ width: 90 }}>Poop</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4:32 pm</td>
                  <td>
                    <RedEx />
                  </td>
                  <td>
                    <YellowEx />
                  </td>
                  <td>
                    <BrownEx />
                  </td>
                </tr>
                <tr>
                  <td>5:52 pm</td>
                  <td>
                    <ColorClose color="rgb(218 73 72)">
                      <i className="nes-icon close is-medium"></i>
                    </ColorClose>
                  </td>
                  <td>
                    <ColorClose color="#ffce00">
                      <i className="nes-icon close is-medium"></i>
                    </ColorClose>
                  </td>
                  <td>
                    <ColorClose color="rgb(91 54 30)">
                      <i className="nes-icon close is-medium"></i>
                    </ColorClose>
                  </td>
                </tr>
                <tr>
                  <td>7:32 pm</td>
                  <td></td>
                  <td>
                    <span className="emoji">💩</span>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        ''
      )}
    </Container>
  );
};

export default RecentActivity;
