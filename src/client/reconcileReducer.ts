import { Action, Reducer } from 'redux';
import ClientAction from './ClientAction';
import hardSet from './stateReconciler/hardSet';

function reconcileReducer<S, A extends Action>(
  reducer: Reducer<S, A>,
  stateReconciler: StateReconciler<S> = hardSet
): Reducer<S, A> {
  return (state, action) => {
    switch (action.type) {
      case 'remote/socketConnected':
      case 'remote/serverStateChanged':
        return stateReconciler((action as unknown as ClientAction<S>).state);
      default:
        return reducer(state, action);
    }
  };
}

export type StateReconciler<S> = (nextState: S) => S;

export default reconcileReducer;
