import Promise from 'bluebird';
import debug from './debug';

const makeAsyncApi = client => {

  let inQuery = false;

  function query(sql, ...values) {
    return query.queryArgs(sql, values);
  }

  query.query = (sql, ...values) => query.queryArgs(sql, values);
  query.queryArgs = (sql, values) => new Promise((resolve, reject) => {
    if (inQuery)
      throw new Error(
        'Commands on same client should be called serially. ' +
        'Do you forget `await`?');
    inQuery = true;
    debug('query params: %s query: %j', JSON.stringify(values).slice(0,60), sql);
    client.query(sql, values, (err, result) => {
      inQuery = false;
      if (err) {
        debug('%s query(%j, %j)', err, sql, values);
        return reject(err);
      }
      debug('query ok: %d rows', result.rowCount);
      return resolve(result);
    });
  });

  query.rows = (sql, ...values) => query.rowsArgs(sql, values);
  query.rowsArgs = async (sql, values) => (await query.queryArgs(sql, values)).rows;

  query.row = (sql, ...values) => query.rowArgs(sql, values);
  query.rowArgs = async (sql, values) => {
    const result = await query.queryArgs(sql, values);
    if (result.rowCount !== 1)
      throw new Error(`SQL: Expected exactly one row result but ${result.rowCount} returned`);
    return result.rows[0];
  };

  query.value = async (sql, ...values) => query.valueArgs(sql, values);
  query.valueArgs = async (sql, values) => {
    // will be better to use require('pgDriver/lib/utils').normalizeQueryConfig
    // but it is private API
    const opts = typeof(sql) === 'string'
      ? {text: sql, rowMode: 'array'}
      : {...sql, rowMode: 'array'};
    const result = await query.rowArgs(opts, values);
    if (result.length !== 1)
      throw new Error(`SQL: Expected exactly one column but ${result.length} returned`);
    return result[0];
  };

  query.inTransaction = false;

  query.startTransaction = () => {
    query.inTransaction = true;
    return query.query('BEGIN');
  };

  query.commit = () => {
    query.inTransaction = false;
    return query.query('COMMIT');
  };

  query.rollback = () => {
    query.inTransaction = false;
    return query.query('ROLLBACK');
  };

  query.end = async () => {
    if (query.inTransaction) {
      await query.rollback();
      throw new Error('Transaction started manually but not closed. Automatic rollback');
    }
  };

  return query;
};

export default makeAsyncApi;
