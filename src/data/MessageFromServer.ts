import Json from './Json';

type MessageFromServer =
  | {
      readonly type: 'connected';
      // Snapshot of the entire state that server would ever disclose to clients
      // at the time of the message.
      // The state is sanitized into a diff.
      readonly stateUpdate: Json;
    }
  | {
      readonly type: 'stateChanged';
      // Diffs of the state since the last update.
      readonly stateUpdate: Json;
    };

export default MessageFromServer;
