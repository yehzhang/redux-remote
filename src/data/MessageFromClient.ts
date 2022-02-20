import { Action } from 'redux';

interface MessageFromClient {
  readonly type: 'actionDispatched';
  readonly action: Action;
}

export default MessageFromClient;
