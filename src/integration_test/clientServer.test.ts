import 'jest';
import { applyMiddleware, createStore, Store } from 'redux';
import clientMiddleware from '../client/clientMiddleware';
import reconcileReducer from '../client/reconcileReducer';
import startServer from '../server/startServer';

describe('clientServer', () => {
  let serverStore: Store<State, Action>;
  let clientStore: Store<State, Action>;

  const port = 8880;
  const serverInitialState: State = { count: 10 };

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
    expect(clientStore.getState()).toEqual(clientInitialState);

    // Waits for server connection.
    await timeoutMs(100);

    // The server updates client state on connection.
    expect(clientStore.getState()).toEqual(serverInitialState);

    clientStore.dispatch({ type: 'addOne' });
    // Waits for websocket communication.
    await timeoutMs(100);

    // The client ignores the first action.
    // The server handles the action.
    expect(serverStore.getState()).toEqual({ count: 11 });
    // The server updates the client state.
    expect(clientStore.getState()).toEqual({ count: 11 });
  });
});

const clientInitialState: State = { count: 0 };
function reducer(state = clientInitialState, action: Action): State {
  switch (action.type) {
    case 'addOne':
      return {
        ...state,
        count: state.count + 1,
      };
    default:
      return state;
  }
}

interface State {
  readonly count: number;
}

interface Action {
  readonly type: 'addOne';
}

function timeoutMs(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
