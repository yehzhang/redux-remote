import { Store } from 'redux';
import { WebSocket, WebSocketServer } from 'ws';
import isAction from '../data/isAction';
import MessageFromClient from '../data/MessageFromClient';
import MessageFromServer from '../data/MessageFromServer';
import parseJsonObject from '../data/parseJsonObject';
import deepDiff from '../diffing/deepDiff';
import ServerOptions from './ServerOptions';

function startServer(store: Store, options: ServerOptions): void {
  if ((process as any).browser) {
    throw new TypeError('ws does not support server in a browser.');
  }

  const { port } = options;
  const server = new WebSocketServer({ port });
  server.on('connection', (client) => {
    // Updates the server store according to actions from the client.
    client.on('message', (rawData) => {
      const message = rawData instanceof Buffer && parseRawData(rawData);
      if (!message) {
        console.error('Unexpected message from client', rawData);
        return;
      }
      store.dispatch(message.action);
    });

    // Initializes the client's state.
    const stateUpdate = deepDiff(stateUpdateDiffBase, store.getState());
    const message: MessageFromServer = {
      type: 'connected',
      stateUpdate:
        stateUpdate === undefined ? stateUpdateDiffBase : stateUpdate,
    };
    const data = JSON.stringify(message);
    client.send(data);
  });

  // Sends the updated state back to all clients.
  let state = store.getState();
  store.subscribe(() => {
    const previousState = state;
    state = store.getState();
    const stateUpdate = deepDiff(previousState, state);
    if (stateUpdate === undefined) {
      return;
    }

    const message: MessageFromServer = {
      type: 'stateChanged',
      stateUpdate,
    };
    const data = JSON.stringify(message);
    for (const client of server.clients) {
      if (client.readyState == WebSocket.OPEN) {
        client.send(data);
      }
    }
  });
}

const stateUpdateDiffBase = {};

function parseRawData(buffer: Buffer): MessageFromClient | null {
  const message = parseJsonObject(buffer.toString());
  // It is a design limitation of TS to not propagate type narrowings to
  // parent objects. Manually creates new objects for type safety.
  if (
    message &&
    message.type === 'actionDispatched' &&
    isAction(message.action)
  ) {
    return {
      type: message.type,
      action: message.action,
    };
  }
  return null;
}

export default startServer;
