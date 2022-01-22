import clientMiddleware from './clientMiddleware';
import { WebSocket } from 'ws';
import ClientAction from './ClientAction';
import MessageFromServer from '../MessageFromServer';
import MessageFromClient from '../MessageFromClient';
import { Action } from 'redux';
import ReconnectingWebSocket from 'reconnecting-websocket';

jest.mock('reconnecting-websocket');

describe('clientMiddlewareTest', () => {
  let middlewareApiDispatch: jest.Mock;
  let storeDispatch: (action: Action) => void;
  let middlewareNext: jest.Mock;

  const testAction = { type: 'test', payload: true } as const;
  const testState = 'testState';

  beforeEach(() => {
    middlewareApiDispatch = jest.fn();
    (ReconnectingWebSocket.prototype as any).readyState = WebSocket.CONNECTING;

    const port = 12312;
    middlewareNext = jest.fn();
    storeDispatch = clientMiddleware({
      uri: `ws://localhost:${port}`,
    })({
      dispatch: middlewareApiDispatch,
      getState: () => testState,
    })(middlewareNext);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not delegate user actions to server when disconnected', () => {
    storeDispatch(testAction);
    expect(ReconnectingWebSocket.prototype.send).not.toHaveBeenCalled();
  });

  it('should let through client actions', () => {
    const action: ClientAction = {
      type: 'remote/socketConnected',
      state: testState,
    };
    storeDispatch(action);

    expect(middlewareNext).toHaveBeenCalledWith(action);
  });

  it('should handle socket connected', () => {
    sendMessageFromServer({
      type: 'connected',
      state: testState,
    });
    expect(middlewareApiDispatch).toHaveBeenCalledWith<[ClientAction]>({
      type: 'remote/socketConnected',
      state: testState,
    });
  });

  it('should handle server state changed', () => {
    sendMessageFromServer({
      type: 'stateChanged',
      state: testState,
    });
    expect(middlewareApiDispatch).toHaveBeenCalledWith<[ClientAction]>({
      type: 'remote/serverStateChanged',
      state: testState,
    });
  });

  describe('when connected', () => {
    beforeEach(() => {
      (ReconnectingWebSocket.prototype as any).readyState = WebSocket.OPEN;
    });

    it('should not delegate framework actions to server', () => {
      const action: ClientAction = {
        type: 'remote/socketConnected',
        state: testState,
      };
      storeDispatch(action);

      expect(ReconnectingWebSocket.prototype.send).not.toHaveBeenCalled();
    });

    it('should delegate user actions to server', () => {
      storeDispatch(testAction);

      const message: MessageFromClient = {
        type: 'actionDispatched',
        action: testAction,
      };
      expect(ReconnectingWebSocket.prototype.send).toHaveBeenCalledWith(
        JSON.stringify(message)
      );
    });
  });
});

function sendMessageFromServer(message: MessageFromServer) {
  const messageEvent = { data: JSON.stringify(message) };
  const spy = ReconnectingWebSocket.prototype
    .addEventListener as unknown as jest.SpyInstance;
  spy.mock.calls.find(([event]) => event === 'message')[1](messageEvent);
}
