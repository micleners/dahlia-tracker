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

  const newDate = `${time}, ${month} ${day}, ${year}`;

  setDate(newDate);
};

const BathroomOptions = ({ optionSelected, setOptionSelected }) => {
  const [poop, setPoop] = useState(false);
  const [pee, setPee] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [time, setTime] = useState(() => getTimeForHtml(date));

  const timeChangeHandler = (event) => {
    setTime(event.target.value);
    parseTime(setDate, event.target.value);
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

      <button type="button" className="nes-btn is-primary">
        Log it!
      </button>
    </>
  );
};

export default BathroomOptions;
