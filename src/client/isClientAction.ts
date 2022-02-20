import isObject from 'lodash/isObject';
import isAction from '../data/isAction';
import ClientAction from './ClientAction';

function isClientAction(action: unknown): action is ClientAction {
  if (!isAction(action)) {
    return false;
  }

  const maybeClientAction: Partial<ClientAction> = action;
  switch (maybeClientAction.type) {
    case 'remote/socketConnected':
    case 'remote/serverStateChanged':
      return isObject(maybeClientAction.stateUpdate);
    default:
      return false;
  }
}

export default isClientAction;
