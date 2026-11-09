import { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  text-align: center;
  font-size: 12px;
`;

const ColorClose = styled.div`
  .close::before {
    color: ${(props) => props.$color};
  }
`;

const Ex = () => <i className="nes-icon close is-small"></i>;

const RedEx = () => (
  <ColorClose $color="rgb(218 73 72)">
    <Ex />
  </ColorClose>
);

const YellowEx = () => (
  <ColorClose $color="#ffce00">
    <Ex />
  </ColorClose>
);

const BrownEx = () => (
  <ColorClose $color="rgb(91 54 30)">
    <Ex />
  </ColorClose>
);

// Must match DEFAULT_LIMIT in functions/getBathroom.mjs.
const PAGE_SIZE = 10;

const RecentActivity = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visits, setVisits] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const loadBathroomVisits = async () => {
      try {
        const res = await fetch('/.netlify/functions/getBathroom');
        const bathroomVisits = await res.json();
        setVisits(bathroomVisits);
        setHasMore(bathroomVisits.length === PAGE_SIZE);
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen === true) {
      loadBathroomVisits();
    }
  }, [isOpen]);

  const formatTime = (strDate) => {
    const date = new Date(strDate);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  };

  const formatDate = (strDate) => {
    const date = new Date(strDate);
    let month = date.getMonth() + 1;
    let day = date.getDate();
    const formattedDate = month + '/' + day + '/' + date.getFullYear();
    return formattedDate;
  };

  const toggle = () => setIsOpen(!isOpen);

  // Asks for the 10 entries older than the last row shown.
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const last = visits[visits.length - 1];
      const res = await fetch(
        `/.netlify/functions/getBathroom?before=${encodeURIComponent(last.time)}`,
      );
      if (!res.ok) throw new Error(`Load more failed (${res.status})`);
      const page = await res.json();
      setVisits((v) => [...v, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Container>
      <div style={{ margin: 20, cursor: 'pointer' }} onClick={toggle}>
        {isOpen ? 'Hide' : 'Show'} Recent
      </div>
      {isOpen ? (
        <>
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
                  <th>Oops</th>
                  <th>Pee</th>
                  <th>Poo</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.time}>
                    <td>
                      {formatTime(visit.time)}
                      <br />
                      {formatDate(visit.time)}
                    </td>
                    <td>{visit.accident && <RedEx />}</td>
                    <td>{visit.pee && <YellowEx />}</td>
                    <td>{visit.poop && <BrownEx />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <button
                type="button"
                className="nes-btn"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </>
      ) : (
        ''
      )}
    </Container>
  );
};

export default RecentActivity;
