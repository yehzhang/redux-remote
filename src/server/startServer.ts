import { Action, Store } from 'redux';
import { WebSocket, WebSocketServer } from 'ws';
import MessageFromClient from '../MessageFromClient';
import MessageFromServer from '../MessageFromServer';
import parseJsonObject from '../parseJsonObject';
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
    const message: MessageFromServer = {
      type: 'connected',
      state: store.getState(),
    };
    const data = JSON.stringify(message);
    client.send(data);
  });

  // Sends the updated state back to all clients.
  store.subscribe(() => {
    const message: MessageFromServer = {
      type: 'stateChanged',
      state: store.getState(),
    };
    const data = JSON.stringify(message);
    for (const client of server.clients) {
      if (client.readyState == WebSocket.OPEN) {
        client.send(data);
      }
    }
  });
}

function parseRawData(buffer: Buffer): MessageFromClient | null {
  const message = parseJsonObject<MessageFromClient>(buffer.toString());
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

function isAction(data: unknown): data is Action {
  return !!data && typeof data === 'object' && 'type' in data;
}

export default startServer;
