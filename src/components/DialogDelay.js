import PuppyChat from './PuppyChat';
import HumanChat from './HumanChat';

import { useDialogDelay } from '../hooks';

const DialogDelay = () => {
  const [myRef1, myRef2, showHuman] = useDialogDelay();

  return (
    <>
      <PuppyChat passRef={myRef1} message="Food?!" />
      {showHuman && (
        <HumanChat message="You always love a meal (:">
          <textarea id="textarea_field" className="nes-textarea"></textarea>
          <button
            type="button"
            className="nes-btn is-primary"
            style={{ float: 'right' }}
            ref={myRef2}
          >
            Log
          </button>
        </HumanChat>
      )}
    </>
  );
};

export default DialogDelay;
