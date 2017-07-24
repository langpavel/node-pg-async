# pg-async 

[![Npm Version](https://badge.fury.io/js/pg-async.svg)](https://badge.fury.io/js/pg-async)
[![NPM downloads](http://img.shields.io/npm/dm/pg-async.svg)](https://www.npmjs.com/package/pg-async)
[![Dependency Status](https://david-dm.org/langpavel/node-pg-async.svg)](https://david-dm.org/langpavel/node-pg-async)
[![devDependency Status](https://david-dm.org/langpavel/node-pg-async/dev-status.svg)](https://david-dm.org/langpavel/node-pg-async#info=devDependencies)
[![Build Status](https://travis-ci.org/langpavel/node-pg-async.svg?branch=master)](https://travis-ci.org/langpavel/node-pg-async)
[![Coverage Status](https://coveralls.io/repos/github/langpavel/node-pg-async/badge.svg?branch=master)](https://coveralls.io/github/langpavel/node-pg-async?branch=master)
[![Join the chat at https://gitter.im/langpavel/node-pg-async](https://badges.gitter.im/langpavel/node-pg-async.svg)](https://gitter.im/langpavel/node-pg-async?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Tiny but powerful Promise based PostgreSQL client for node.js
designed for easy use with ES7 async/await.<br/>
Based on [node-postgres](https://github.com/brianc/node-postgres) (known as `pg` in npm registry).
Can use `pg` or native `pg-native` backend.

## Example

```js
import PgAsync, {SQL} from 'pg-async';

// using default connection
const pgAsync = new PgAsync();

const userTable = 'user';
const sqlUserByLogin = (login) => SQL`
  select id
  from $ID${userTable}
  where login = ${login}
`;

async function setPassword(login, newPwd) {
  const userId = await pgAsync.value(sqlUserByLogin(login));
  // userId is guaranted here,
  // pgAsync.value requires query yielding exactly one row with one column.
  await pgAsync.query(SQL`
    update $ID${userTable} set
      passwd = ${newPwd}
    where userId = ${userId}
  `);
}

```

## Install

```
$ npm install --save pg-async
```

## API

#### Configuring Connection Options
```js
new PgAsync([connectionOptions], [driver])
```

* The default export of `pg-async` is `PgAsync` class which let you configure connection options
* Connection options defaults to [`pg.defaults`](https://github.com/brianc/node-postgres/wiki/pg#pgdefaults)
* Optional `driver` let you choose underlying library
* To use the [native bindings](https://github.com/brianc/node-pg-native.git) you must `npm install --save pg-native`

```js
import PgAsync from 'pg-async';

// using default connection
const pgAsync = new PgAsync();

// using connection string
const pgAsync = new PgAsync('postgres://user:secret@host:port/database');

// using connection object
const pgAsync = new PgAsync({user, password, host, port, database, ...});

// using default for current user, with native driver
// install pg-native package manually
const pgAsync = new PgAsync(null, 'native');
const pgAsync = new PgAsync(null, require('pg').native);
```

---

#### ```await pgAsync.query(SQL`...`) -> pg.Result```
#### `await pgAsync.query(sql, values...) -> pg.Result`
#### `await pgAsync.queryArgs(sql, [values]) -> pg.Result`

* Execute SQL and return `Result` object from underlying `pg` library
* Interesting properties on `Result` object are:
  * `rowCount` Number ­– returned rows
  * `oid` Number ­– Postgres oid
  * `rows` Array ­– Actual result of `pgAsync.rows()`
  * `rowAsArray` Boolean
  * `fields` Array of:
    * `name` String ­– name or alias of column
    * `tableID` Number ­– oid of table or 0
    * `columnID` Number ­– index of column in table or 0
    * `dataTypeID` Number ­– oid of data type
    * `dataTypeSize` Number ­– size in bytes od colum, -1 for variable length
    * ­`dataTypeModifier` Number 

---

#### ```await pgAsync.rows(SQL`...`) -> array of objects```
#### `await pgAsync.rows(sql, values...) -> array of objects`
#### `await pgAsync.rowsArgs(sql, [values]) -> array of objects`

* Execute SQL and return array of key/value objects (`result.rows`)

---

#### ```await pgAsync.row(SQL`...`) -> object```
#### `await pgAsync.row(sql, values...) -> object`
#### `await pgAsync.rowArgs(sql, [values]) -> object`

* Execute SQL and return single key/value object.
  If query yields more than one or none rows, promise will be rejected.
* Rejected promise throw exception at **`await`** location.

---

#### ```await pgAsync.value(SQL`...`) -> any```
#### `await pgAsync.value(sql, values...) -> any`
#### `await pgAsync.valueArgs(sql, [values]) -> any`

* Same as row, but query must yields single column in single row, otherwise throws.

---

#### `await pgAsync.connect(async (client) => innerResult) -> innerResult`

* Execute multiple queries in sequence on same connection. This is handy for transactions.
* `asyncFunc` here has signature `async (client, pgClient) => { ... }`
* provided `client` has async methods:
  * `query`, `rows`, `row`, `value` as above
  * `queryArgs`, `rowsArgs`, `rowArgs`, `valueArgs` as above
  * `startTransaction`, `commit`, `rollback` - start new transaction manually. Use `pgAsync.transaction` when possible
* `client` itself is shorthand for `query`

---

#### `await pgAsync.transaction(async (client) => innerResult) -> innerResult`

Transaction is similar to `connect` but automatically start and commit transaction,
rollback on throwen error
__Example:__

```js
const pgAsync = new PgAsync();

function moveMoney(fromAccount, toAccount, amount) {
  return pgAsync.transaction(async (client) => {
    let movementFrom, movementTo, movementId;
    const sql = `
      INSERT INTO bank_account (account, amount)
      VALUES ($1, $2)
      RETURNS id
    `;
    movementFrom = await client.value(sql, [fromAccount, -amount]);
    movementTo = await client.value(sql, [toAccount, amount]);
    return {movementFrom, movementTo}
  });
}

async function doTheWork() {
  // ...
  try {
    const result = await moveMoney('alice', 'bob', 19.95);
    // transaction is commited
  } catch (err) {
    // transaction is rollbacked
  }
  // ...
}
```

---

#### `await pgAsync.getClient([connectionOptions]) -> {client, done}`

* Get unwrapped `pg.Client` callback based instance.<br/>
  You should not call this method unless you know what are you doing.
* Client must be returned to pool manually by calling `done()`

---

#### `pgAsync.closeConnections()`

* Disconnects all idle clients within all active pools, and has all client pools terminate.
  See [`pool.end()`](https://node-postgres.com/api/pool#pool-end)
* This actually terminates all connections on driver used by Pg instance

---

## Features

 * [x] `pg` driver support
 * [x] `pg.native` driver support
 * [x] [`debug`](https://github.com/visionmedia/debug#readme) — Enable debugging with `DEBUG="pg-async"` environment variable
 * [x] Transaction API wrapper - Postgres does not support nested transactions
 * [x] Template tag SQL formatting
 * [ ] Transaction `SAVEPOINT` support
 * [ ] Cursor API wrapper

If you miss something, don't be shy, just
[open new issue!](https://github.com/langpavel/node-pg-async/issues)
It will be nice if you label your issue with prefix `[bug]` `[doc]` `[question]` `[typo]`
etc.

## License (MIT)

Copyright (c) 2016 Pavel Lang (langpavel@phpskelet.org)

<small>
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
</small>
