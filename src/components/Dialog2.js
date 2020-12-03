import PuppyChat from './PuppyChat';
import HumanChat from './HumanChat';
import ActionOptions from './ActionOptions';
import { useDialogDelay } from '../hooks';
import BathroomOptions from './BathroomOptions';

const Dialog1 = ({ optionSelected }) => {
  const [ref1, ref2, showDialog2] = useDialogDelay(500);
  const [ref3, ref4, showDialog3] = useDialogDelay(1000);

  const pupMessage =
    optionSelected === 'Accident'
      ? '*sniff* *sniff* Here? '
      : 'Bork! *wag* *wag*';

  const humanMessage =
    optionSelected === 'Accident'
      ? "It's okay. You'll get the hang of it!"
      : 'Good girl ♥️ Have a treat!';

  return (
    <>
      <PuppyChat ref={ref1} message={pupMessage} />
      {showDialog2 && <HumanChat ref={ref2} message={humanMessage}></HumanChat>}
      {showDialog3 && (
        <HumanChat ref={ref3} message="Here's what happened:">
          <BathroomOptions />
        </HumanChat>
      )}
    </>
  );
};

export default Dialog1;
