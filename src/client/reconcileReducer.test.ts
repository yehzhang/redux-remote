import { Reducer } from 'redux';
import ClientAction from './ClientAction';
import reconcileReducer from './reconcileReducer';

describe('reconcileReducer', () => {
  let reducer: Reducer<State, Action | ClientAction>;

  beforeEach(() => {
    reducer = reconcileReducer(rootReducer) as any;
  });

  it('should reduce user action', () => {
    const state = reducer(initialState, { type: 'addOne' });
    expect(state).toEqual({
      count: 1,
      data: {
        name: 'name',
        weight: 10,
        initial: true,
      },
    });
  });

  it('should reduce socket connected', () => {
    const state = reducer(initialState, {
      type: 'remote/socketConnected',
      stateUpdate: {
        data: {
          name: 'name',
          weight: 20,
        },
      },
    });
    expect(state).toEqual({
      count: 0,
      data: {
        initial: true,
        name: 'name',
        weight: 20,
      },
    });
  });

  it('should reduce server state changed', () => {
    const state = reducer(initialState, {
      type: 'remote/serverStateChanged',
      stateUpdate: {
        count: 2,
        data: {
          name: 'name',
          weight: 20,
        },
      },
    });
    expect(state).toEqual({
      count: 2,
      data: {
        initial: true,
        name: 'name',
        weight: 20,
      },
    });
  });
});

interface State {
  readonly count: number;
  readonly data: {
    readonly name: string;
    readonly weight: number;
    readonly initial?: boolean;
  };
}

const initialState: State = {
  count: 0,
  data: {
    name: 'name',
    weight: 10,
    initial: true,
  },
};

interface Action {
  readonly type: 'addOne';
}

function rootReducer(state = initialState, action: Action): State {
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
