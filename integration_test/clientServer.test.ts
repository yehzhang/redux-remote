import 'jest';
import { applyMiddleware, createStore, Store } from 'redux';
import clientMiddleware from '../src/client/clientMiddleware';
import reconcileReducer from '../src/client/reconcileReducer';
import startServer from '../src/server/startServer';

describe('clientServer', () => {
  let serverStore: Store<number, Action>;
  let clientStore: Store<number, Action>;

  const port = 8880;
  const serverInitialState = 10;

  beforeEach(() => {
    serverStore = createStore(reducer, serverInitialState);
    startServer(serverStore, {
      port,
    });
    clientStore = createStore(
      reconcileReducer(reducer),
      applyMiddleware(
        clientMiddleware({
          uri: `ws://localhost:${port}`,
        })
      )
    );
  });

  it('should work', async () => {
    clientStore.dispatch({ type: 'addOne' });

    // Ignores client side updates.
    expect(clientStore.getState()).toBe(0);

    // Waits for server connection.
    await timeoutMs(100);

    // The server updates client state on connection.
    expect(clientStore.getState()).toBe(serverInitialState);

    clientStore.dispatch({ type: 'addOne' });
    // Waits for websocket communication.
    await timeoutMs(100);

    // The client ignores the first action.
    // The server handles the action.
    expect(serverStore.getState()).toBe(11);
    // The server updates the client state.
    expect(clientStore.getState()).toBe(11);
  });
});

function reducer(state = 0, action: Action): number {
  switch (action.type) {
    case 'addOne':
      return state + 1;
    default:
      return state;
  }
}

interface Action {
  readonly type: 'addOne';
}

function timeoutMs(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
