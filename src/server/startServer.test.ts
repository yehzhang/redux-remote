import { WebSocket, WebSocketServer } from 'ws';
import createMockStore, { MockStore } from 'redux-mock-store';
import startServer from './startServer';
import MessageFromClient from '../MessageFromClient';
import MessageFromServer from '../MessageFromServer';

jest.mock('ws');

describe('startServer', () => {
  let store: MockStore;
  let client: jest.Mocked<Writable<WebSocket>>;
  let subscribe: jest.SpyInstance;

  const testAction = { type: 'test', payload: true } as const;
  const testState = 'testState';

  beforeEach(() => {
    store = createMockStore()(testState);
    subscribe = jest.spyOn(store, 'subscribe');
    client = new (WebSocket as any)();
    WebSocketServer.prototype.clients = new Set([client]);
    (
      WebSocketServer.prototype.on as unknown as jest.SpyInstance
    ).mockImplementation((event, listener) => {
      if (event === 'connection') {
        listener(client);
      }
    });

    startServer(store, { port: 8080 });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should initiaize client state', () => {
    const message: MessageFromServer = {
      type: 'connected',
      state: testState,
    };
    expect(client.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should dispatch client actions', () => {
    const sendClientMessage = client.on.mock.calls.find(
      ([event]) => event === 'message'
    )![1] as any;
    const message: MessageFromClient = {
      type: 'actionDispatched',
      action: testAction,
    };
    sendClientMessage(Buffer.from(JSON.stringify(message)));

    expect(store.getActions()).toEqual([testAction]);
  });

  it('should send state updates to open clients', () => {
    client.readyState = WebSocket.OPEN;
    subscribe.mock.calls[0][0]();

    const message: MessageFromServer = {
      type: 'stateChanged',
      state: testState,
    };
    expect(client.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should not send state updates to connecting clients', () => {
    client.send.mockReset();

    subscribe.mock.calls[0][0]();

    expect(client.send).not.toHaveBeenCalled();
  });
});

type Writable<T> = { -readonly [K in keyof T]: T[K] };
