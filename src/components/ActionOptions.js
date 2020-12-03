import styled from 'styled-components';

const OptionContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  button {
    margin: 10px 20px 10px 0;
  }

  button:first-of-type {
  }
  /* grid-template-columns: 1fr 1fr; */
  /* grid-gap: 1em; */
`;

const ActionOptions = ({ optionSelected, setOptionSelected }) => {
  const OptionButton = ({ width, option }) => {
    let disabled = false;
    const disabledStyles = {};
    if (optionSelected !== '' && optionSelected !== option) {
      disabled = true;
      disabledStyles['backgroundColor'] = '#d3d3d3';
    }

    return (
      <button
        disabled={disabled}
        type="button"
        className="nes-btn is-primary"
        style={{ width: width || 180, ...disabledStyles }}
        onClick={() => setOptionSelected(option)}
      >
        {option}
      </button>
    );
  };

  return (
    <>
      <OptionContainer>
        <OptionButton option="Accident" />
        <OptionButton option="Good Job!" />
      </OptionContainer>
    </>
  );
};

export default ActionOptions;
