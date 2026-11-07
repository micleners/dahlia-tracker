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
  const OptionButton = ({ width, option, button }) => {
    let disabled = false;
    const disabledStyles = {};
    if (optionSelected !== '' && optionSelected !== option) {
      disabled = true;
      disabledStyles['backgroundColor'] = '#d3d3d3';
    }

    const handleClick = (option) => {
      setOptionSelected('');
      setTimeout(() => {
        setOptionSelected(option);
      }, 1);
    };

    return (
      <button
        // disabled={disabled}
        type="button"
        className={`nes-btn is-${button}`}
        style={{ width: width || 180, ...disabledStyles }}
        onClick={() => handleClick(option)}
      >
        {option}
      </button>
    );
  };

  return (
    <>
      <OptionContainer>
        <OptionButton option="Good Job!" button="success" />
        <OptionButton option="Accident" button="error" />
      </OptionContainer>
    </>
  );
};

export default ActionOptions;
