type MessageFromServer =
  | {
      readonly type: 'connected';
      readonly state: unknown;
    }
  | {
      readonly type: 'stateChanged';
      readonly state: unknown;
    };

export default MessageFromServer;
