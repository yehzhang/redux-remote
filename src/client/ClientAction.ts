import Json from '../data/Json';

type ClientAction =
  | {
      readonly type: 'remote/socketConnected';
      readonly stateUpdate: Json;
    }
  | {
      readonly type: 'remote/serverStateChanged';
      readonly stateUpdate: Json;
    };

export default ClientAction;
