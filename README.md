# pg-async [![Circle CI](https://circleci.com/gh/langpavel/node-pg-async.svg?style=shield)](https://circleci.com/gh/langpavel/node-pg-async) [![npm version](https://badge.fury.io/js/pg-async.svg)](https://badge.fury.io/js/pg-async) ![npm dependencies](https://david-dm.org/langpavel/node-pg-async.svg)

Tiny but powerful Promise based PostgreSQL client for node.js
designed for usage with ES7 async/await.<br/>
Based on [node-postgres](https://github.com/brianc/node-postgres) (known as `pg`).
Can use pure JavaScript or native `pg` backend.

## Install

```
$ npm install --save pg-async
```

## API

#### `query(sql, [values], [connectionOptions]): Promise -> pg.Result`

* Execute SQL and return `Result` object from underlying `pg` library

---

#### `rows(sql, [values], [connectionOptions]): Promise -> array of objects`

* Execute SQL and return array of key/value objects (`result.rows`)

---

#### `row(sql, [values], [connectionOptions]): Promise -> object`

* Execute SQL and return single key/value object.
  If query yields more than one or none rows, promise will be rejected.
* Rejected promise throw exception at **`await`** location.

---

#### `value(sql, [values], [connectionOptions]): Promise -> any`

* Same as row, but query must yields single column in single row, otherwise throws.

---

#### `connect([conString], asyncFunc): Promise`

* Execute multiple queries in sequence on same connection. This is handy for transactions.
* `asyncFunc` here has signature `async (client, pgClient) => { ... }`
* provided `client` has async methods `query`, `rows`, `row` and `value`.
* `client` itself is shorthand for `query`

__Example:__

```js
function transaction(fromAccount, toAccount, amount) {
  return connect(async (c) => {
    await c('BEGIN');
    let movementFrom, movementTo, movementId;
    try {
      const sql = 'INSERT INTO bank_account (account, amount) VALUES ($1, $2) RETURNS id';
      movementFrom = await c.value(sql, [fromAccount, -amount]);
      movementTo = await c.value(sql, [toAccount, amount]);
      movementId = await c(
        'INSERT INTO movement (from, to, amount) VALUES ($1, $2, $3) RETURNS id',
        [movementFrom, movementTo, amount]);
      await c('COMMIT');
    } catch (err) {
      await c('ROLLBACK');
    }
  });
}
```

---

#### `setDefaultConnection(defaults)`

* This parameters are used as defaults if no `connectionOptions` are provided to methods above.
* Note that this and `pg.defaults` are separate objcts/strings.
  Resolution of connection options can be described as:<br/>
  **`connectionOptions`**<small>(provided to function)</small>
  **`|| pg-async.defaultConnection || pg.defaults`**
* See [`pg.defaults`](https://github.com/brianc/node-postgres/wiki/pg#pgdefaults)
  for more.

---

#### `driver()` — returns used `pg` instance<br/>`driver(pg)` — set `pg` instance

* To install the [native bindings](https://github.com/brianc/node-pg-native.git):

```sh
$ npm install --save pg pg-native
```
then you can call `driver(require('pg').native)`

---

### `getClient([connectionOptions]): Promise -> {client, done}`

* Get unwrapped `pg.Client` callback based instance.<br/>
  You should not call this method unless you know what are you doing.
* Client must be returned to pool manually by calling `done()`

---

#### closeConnections()

* Disconnects all idle clients within all active pools, and has all client pools terminate.
  See [`pg.end()`](https://github.com/brianc/node-postgres/wiki/pg#end)

---

## Features

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
