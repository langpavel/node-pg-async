import debugLib from 'debug';
import Promise from 'bluebird';
import PG from 'pg';

const debug = debugLib('pg-async');

let pg = PG;
let defaultConnection;

export function driver(newDriver) {
  if (newDriver) {
    /* istanbul ignore next */
    if (debug.enabled) {
      let driverName;
      if (typeof newDriver.driverName === 'string')
        driverName = newDriver.driverName;
      else if (newDriver === PG)
        driverName = 'pg';
      else try {
        driverName = newDriver === PG.native ? 'pg.native' : 'unknown';
      } catch (_) {
        driverName = 'unknown';
      }
      debug('new driver set: %s', driverName);
    }
    const tmp = pg;
    pg = newDriver;
    return tmp;
  }
  return pg;
}

export function setDefaultConnection(options) {
  defaultConnection = options;
  debug('defaultConnection: ', getDefaultConnection());
}

function getDefaultConnection() {
  return defaultConnection || pg.defaults;
}

export async function getClient(conString = getDefaultConnection()) {
  return new Promise((resolve, reject) => {
    pg.connect(conString, (err, client, done) => {
      if (err) {
        debug('%s getClient(%j)', err, getDefaultConnection());
        if (done) done(err);
        return reject(err);
      }
      return resolve({client, done});
    });
  });
}

const makeAsyncApi = client => {
  function query(sql, values) {
    return query.query(sql, values);
  }

  query.query = (sql, values) =>
    new Promise((resolve, reject) => {
      debug('query params: %j query: %j', values, sql);
      client.query(sql, values, (err, result) => {
        if (err) {
          debug('%s query(%j, %j)', err, sql, values);
          return reject(err);
        }
        debug('query ok: %d rows', result.rowCount);
        return resolve(result);
      });
    });

  query.rows = async (sql, values) => (await query.query(sql, values)).rows;

  query.row = async (sql, values) => {
    const result = await query.query(sql, values);
    if (result.rowCount !== 1)
      throw new Error(`SQL: Expected exactly one row result but ${result.rowCount} returned`);
    return result.rows[0];
  };

  query.value = async (sql, values) => {
    // will be better to use require('pg/lib/utils').normalizeQueryConfig
    // but it is private API
    const opts = typeof(sql) === 'string'
      ? {text: sql, rowMode: 'array'}
      : {...sql, rowMode: 'array'};
    const result = await query.row(opts, values);
    if (result.length !== 1)
      throw new Error(`SQL: Expected exactly one column but ${result.length} returned`);
    return result[0];
  };

  return query;
};

export async function connect(conString, asyncFunc) {
  if (typeof asyncFunc === 'undefined') {
    asyncFunc = conString;
    conString = getDefaultConnection();
  }

  if (typeof asyncFunc !== 'function')
    throw new TypeError('async function expected');

  const {client, done} = await getClient(conString);
  try {
    const result = await asyncFunc(makeAsyncApi(client));
    done();
    return result;
  } catch (err) {
    done(err);
    throw err;
  }
}

const wrap = func => (sql, values, conString) =>
  connect(conString, q => q[func](sql, values));

export const query = wrap('query');
export const rows = wrap('rows');
export const row = wrap('row');
export const value = wrap('value');

export const closeConnections = () => pg.end();
