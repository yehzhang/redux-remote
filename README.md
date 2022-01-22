# Redux Remote

Redux Remote is a high level networking library for [Redux](https://github.com/reduxjs/redux). It runs Redux on both client and server, maintaining the same state. It allows users to use Redux as the only API for state transfer between client and server.

Redux Remote is designed for indie and small multiplayer online games, or more generally apps with requirements:

- Realtime
- <100ms latency
- Atomic state updates.

## Why Use It

Redux Remote offers everything Redux offers plus more:

- **Quick Start**: You can build working apps without a single line of networking code.
- **Simple Stack**: No need to design and implement REST APIs. Redux Remote directly plumbs updates into Redux stores.
- **Realtime**: A server pushes updates to clients as the updates happen.
- **Gaming Grade Latency**: Updates from a client reach other clients in <100ms round trip time, as they happen in memory.
- **Authority**: A server owns the logic to update state, highering the bar for malicious clients to tamper with shared state.
- **Atomicity**: Redux updates state synchronously, preventing concurrent updates from corrupting data.
- **Eventual Consistency**: A server is the single source of truth, constantly pushing clients to match the same state.
- **Extensibility**: Supported by the Redux ecosystem, you can use as few or as many addons as you need. For example, a server can gain storage capabilities with [redux-persist](https://github.com/rt2zz/redux-persist) without a database.
- **Focus**: If you do not need to worry about networking, API, or database, you get to work on all the business logic that matters.

## Installation

```sh
yarn add @yehzhang/redux-remote
```

(Unfortunately, `redux-remote` package is taken by an archived repository. We are working on it!)

## Usage

The usage involves adding `reconcileReducer` and `clientMiddleware` to your client setup, and `startServer` to your server setup:

```js
// client.js
import { createStore, applyMiddleware } from 'redux';
import { clientMiddleware, reconcileReducer } from '@yehzhang/redux-remote';
import port from './port';
import rootReducer from './reducers';

const store = createStore(
  reconcileReducer(rootReducer),
  applyMiddleware(
    // Other middlewares go above here...
    clientMiddleware({
      uri: `ws://localhost:${port}`,
    })
  )
);

// server.js
import { createStore } from 'redux';
import { startServer } from '@yehzhang/redux-remote';
import port from './port';
import rootReducer from './reducers';

const store = createStore(rootReducer);
startServer(store, {
  port,
});
```

If you use other middlewares in addition to `clientMiddleware`, make sure to put `clientMiddleware` after them in the composition chain because the middleware delegates actions to server and potentially skips the following middlewares. Alternatively, consider moving client side middlewares to server side.

## How It Works

Redux Remote is a simple library. In essense, it:

1. Keeps one Redux store in a client and one in a server. Both stores share the same state.
1. Delegates client dispatched actions to the server.
1. Sends updated state back to the client using WebSocket.
