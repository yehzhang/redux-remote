type ClientAction<S = unknown> =
  | {
      readonly type: 'remote/socketConnected';
      readonly state: S;
    }
  | {
      readonly type: 'remote/serverStateChanged';
      readonly state: S;
    };

export default ClientAction;
