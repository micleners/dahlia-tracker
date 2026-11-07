import PuppyChat from './PuppyChat';
import HumanChat from './HumanChat';
import ActionOptions from './ActionOptions';
import { useDialogDelay } from '../hooks';

const Dialog1 = ({ optionSelected, setOptionSelected }) => {
  const [ref1, ref2, showHuman] = useDialogDelay(500);

  return (
    <>
      <PuppyChat message="Hi human. Wha ha-happened?">
        <span ref={ref1} />
      </PuppyChat>
      {showHuman && (
        <HumanChat message="Hi puppers! You dunna">
          <ActionOptions
            optionSelected={optionSelected}
            setOptionSelected={setOptionSelected}
          />
          <span ref={ref2} />
        </HumanChat>
      )}
    </>
  );
};

export default Dialog1;
