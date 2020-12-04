import { useState } from 'react';
import styled from 'styled-components';

const CheckBoxes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 1em;
`;

const getTimeForHtml = (date) => {
  let hour = date.getHours(),
    min = date.getMinutes();

  hour = (hour < 10 ? '0' : '') + hour;
  min = (min < 10 ? '0' : '') + min;

  const displayTime = hour + ':' + min;
  return displayTime;
};

const parseTime = (setDate, time) => {
  const date = new Date();

  let day = date.getDate(),
    month = date.getMonth() + 1,
    year = date.getFullYear();

  month = (month < 10 ? '0' : '') + month;
  day = (day < 10 ? '0' : '') + day;

  const [hour, minute] = time.split(':');

  const newDate = new Date(year, month, day, hour, minute, 0);

  setDate(newDate);
};

const BathroomOptions = ({ accident }) => {
  const [selectWarning, setSelectWarning] = useState(false);
  const [poop, setPoop] = useState(false);
  const [pee, setPee] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [time, setTime] = useState(() => getTimeForHtml(date));

  const timeChangeHandler = (event) => {
    setTime(event.target.value);
    parseTime(setDate, event.target.value);
  };

  console.log(date);
  console.log(time);

  const handleSumbit = async () => {
    setSelectWarning(false);
    if (!pee && !poop) {
      setTimeout(() => {
        setSelectWarning(true);
      }, 10);
      return;
    }
    try {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          Notes: textInput,
          Pee: pee,
          Poop: poop,
          Time: date.toISOString(),
          Accident: accident,
        }),
      };
      const res = await fetch('/.netlify/functions/saveBathroom', options);
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <CheckBoxes>
        <label>
          <input
            type="checkbox"
            className="nes-checkbox"
            value={poop}
            onChange={(event) => setPoop(event.target.checked)}
          />
          <span>Poop</span>
        </label>

        <label>
          <input
            type="checkbox"
            className="nes-checkbox"
            value={pee}
            onChange={(event) => setPee(event.target.checked)}
          />
          <span>Pee</span>
        </label>
      </CheckBoxes>
      {selectWarning && (
        <div className="nes-text is-error" style={{ fontSize: 12 }}>
          Must select an option
        </div>
      )}

      <br />

      <div className="nes-field">
        <label>When it done?</label>
        <input
          type="time"
          id="name_field"
          className="nes-input"
          value={time}
          onChange={timeChangeHandler}
        />
      </div>

      <br />

      <div className="nes-field">
        <label>Where? Much? Etc.</label>
        <textarea
          id="textarea_field"
          className="nes-textarea"
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
        />
      </div>

      <br />

      <button
        type="button"
        className="nes-btn is-primary"
        onClick={handleSumbit}
      >
        Log it!
      </button>
    </>
  );
};

export default BathroomOptions;
