import { Middleware } from 'redux';
import ReconnectingWebSocket from 'reconnecting-websocket';
import MessageFromClient from '../MessageFromClient';
import MessageFromServer from '../MessageFromServer';
import ClientAction from './ClientAction';
import parseJsonObject from '../parseJsonObject';
import { WebSocket } from 'isomorphic-ws';
import ClientOptions from './ClientOptions';

function clientMiddleware(options: ClientOptions): Middleware {
  const { uri, optimistic } = options;
  return ({ dispatch }) => {
    const socket = new ReconnectingWebSocket(uri, /* protocols= */ undefined, {
      WebSocket,
    });
    // Updates the client store according to server messages.
    socket.addEventListener('message', (event) => {
      const message = parseRawData(event.data);
      if (!message) {
        console.error('Unexpected message from server', event.data);
        return;
      }
      const action = buildClientAction(message);
      if (!action) {
        console.error('Unexpected server message type', message);
        return;
      }
      dispatch(action);
    });

    return (next) => (action) => {
      // Let through client actions or when optimistic is enabled.
      if (clientActionTypes.includes(action?.type) || optimistic) {
        next(action);
        return;
      }

      // Sends user actions to server.
      if (socket.readyState != WebSocket.OPEN) {
        return;
      }
      const message: MessageFromClient = {
        type: 'actionDispatched',
        action,
      };
      socket.send(JSON.stringify(message));
    };
  };
}

const clientActionTypes: readonly ClientAction['type'][] = [
  'remote/socketConnected',
  'remote/serverStateChanged',
];

function parseRawData(rawData: unknown): MessageFromServer | null {
  const message =
    typeof rawData === 'string' && parseJsonObject<MessageFromServer>(rawData);
  if (!message) {
    return null;
  }
  // It is a design limitation of TS to not propagate type narrowings to
  // parent objects. Manually creates new objects for type safety.
  if (
    (message.type === 'connected' || message.type === 'stateChanged') &&
    'state' in message
  ) {
    return {
      type: message.type,
      state: message.state,
    };
  }
  return null;
}

function buildClientAction(message: MessageFromServer): ClientAction | null {
  switch (message.type) {
    case 'connected':
      return {
        type: 'remote/socketConnected',
        state: message.state,
      };
    case 'stateChanged':
      return {
        type: 'remote/serverStateChanged',
        state: message.state,
      };
    default:
      return null;
  }
}

export default clientMiddleware;
