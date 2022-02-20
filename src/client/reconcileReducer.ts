import { Action, Reducer } from 'redux';
import deepMerge from '../diffing/deepMerge';
import Diff from '../diffing/Diff';
import ClientAction from './ClientAction';
import isClientAction from './isClientAction';

// The state needs to extend an object or it is difficult to merge state updates.
// Do not mention client action in the return type Reducer because it will contaminate
// the Store type and confuse users.
function reconcileReducer<S extends object, A extends Action>(
  reducer: Reducer<S, A>
): Reducer<S, A> {
  return (state, action) => {
    if (!isClientAction(action)) {
      return reducer(state, action);
    }

    // `action` is `A & ClientAction` which breaks discriminated union.
    const clientAction: ClientAction = action;
    switch (clientAction.type) {
      case 'remote/socketConnected':
      case 'remote/serverStateChanged':
        // The state must be initialized by client reducers before merging.
        // It is ok to assume so because the store initializes the state on creation.
        return deepMerge(state as S, clientAction.stateUpdate as Diff) as S;
    }
  };
}

export default reconcileReducer;
