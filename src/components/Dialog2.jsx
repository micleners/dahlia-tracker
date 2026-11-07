import PuppyChat from './PuppyChat';
import HumanChat from './HumanChat';
import ActionOptions from './ActionOptions';
import { useDialogDelay } from '../hooks';
import BathroomOptions from './BathroomOptions';

const Dialog1 = ({ optionSelected }) => {
  const isAccident = optionSelected === 'Accident';

  const [ref1, ref2, showDialog2] = useDialogDelay(500);
  const [ref3, ref4, showDialog3] = useDialogDelay(1000);

  const pupMessage = isAccident
    ? '*sniff* *sniff* Here? '
    : 'Bork! *wag* *wag*';

  const humanMessage = isAccident
    ? "It's okay. You'll get the hang of it!"
    : 'Good girl ♥️ Have a treat!';

  return (
    <>
      <PuppyChat message={pupMessage}>
        <span ref={ref1} />
      </PuppyChat>
      {showDialog2 && (
        <HumanChat message={humanMessage}>
          <span ref={ref2} />
        </HumanChat>
      )}
      {showDialog3 && (
        <HumanChat>
          {isAccident ? (
            <p className="nes-text is-error">Accident Report:</p>
          ) : (
            <p className="nes-text is-success">Success Report:</p>
          )}
          <BathroomOptions accident={isAccident} />
          <span ref={ref4} />
        </HumanChat>
      )}
    </>
  );
};

export default Dialog1;
