import PuppyChat from './PuppyChat';
import HumanChat from './HumanChat';
import ActionOptions from './ActionOptions';
import { useDialogDelay } from '../hooks';

const Dialog1 = ({ optionSelected, setOptionSelected }) => {
  const [ref1, ref2, showHuman] = useDialogDelay();

  return (
    <>
      <PuppyChat ref={ref1} message="Hi human. Wha ha-happened?" />
      {showHuman && (
        <HumanChat ref={ref2} message="Hi puppers! You dunna">
          <ActionOptions
            optionSelected={optionSelected}
            setOptionSelected={setOptionSelected}
          />
        </HumanChat>
      )}
    </>
  );
};

export default Dialog1;
