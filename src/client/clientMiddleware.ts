import { Middleware } from 'redux';
import ReconnectingWebSocket from 'reconnecting-websocket';
import MessageFromClient from '../data/MessageFromClient';
import MessageFromServer from '../data/MessageFromServer';
import ClientAction from './ClientAction';
import parseJsonObject from '../data/parseJsonObject';
import { WebSocket } from 'isomorphic-ws';
import ClientOptions from './ClientOptions';
import isClientAction from './isClientAction';

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
      // Lets through client actions and does not propagate to server.
      if (isClientAction(action)) {
        next(action);
        return;
      }

      // Lets through user actions when optimistic is enabled.
      if (optimistic) {
        next(action);
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

function parseRawData(rawData: unknown): MessageFromServer | null {
  const message = typeof rawData === 'string' && parseJsonObject(rawData);
  if (!message) {
    return null;
  }

  // It is a design limitation of TS to not propagate type narrowings to
  // parent objects. Manually creates new objects for type safety.
  if (
    (message.type === 'connected' || message.type === 'stateChanged') &&
    'stateUpdate' in message
  ) {
    return {
      type: message.type,
      stateUpdate: message.stateUpdate,
    };
  }
  return null;
}

function buildClientAction(message: MessageFromServer): ClientAction | null {
  switch (message.type) {
    case 'connected':
      return {
        type: 'remote/socketConnected',
        stateUpdate: message.stateUpdate,
      };
    case 'stateChanged':
      return {
        type: 'remote/serverStateChanged',
        stateUpdate: message.stateUpdate,
      };
    default:
      return null;
  }
}

export default clientMiddleware;
