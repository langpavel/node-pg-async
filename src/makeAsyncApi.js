import Promise from 'bluebird';
import debug from './debug';
import SQL, {SqlFragment} from './sql';

const makeAsyncApi = client => {

  let inQuery = false;

  function query(sql, ...values) {
    return query.queryArgs(sql, values);
  }

  let _queryArgs = (sql, values) => {
    if (sql instanceof SqlFragment) {
      values = sql.values;
      sql = sql.text;
    }

    inQuery = true;
    return new Promise((resolve, reject) => {
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
  };

  query.SQL = SQL;

  query.query = (sql, ...values) => query.queryArgs(sql, values);
  query.queryArgs = (sql, values) => {
    if (inQuery)
      throw new Error(
        'Commands on same client should be called serially. ' +
        'Do you forget `await`?');
    return _queryArgs(sql, values);
  };

  query.rows = (sql, ...values) => query.rowsArgs(sql, values);
  query.rowsArgs = (sql, values) => query.queryArgs(sql, values).then(r => r.rows);

  query.row = (sql, ...values) => query.rowArgs(sql, values);
  query.rowArgs = async (sql, values) => {
    const result = await query.queryArgs(sql, values);
    if (result.rowCount !== 1)
      throw new Error(`SQL: Expected exactly one row result but ${result.rowCount} returned`);
    return result.rows[0];
  };

  query.value = async (sql, ...values) => query.valueArgs(sql, values);
  query.valueArgs = async (sql, values) => {
    let opts;
    if (sql instanceof SqlFragment) {
      opts = {
        ...sql,
        rowMode: 'array',
      };
      values = sql.values;
    } else {
      opts = typeof(sql) === 'string'
        ? {text: sql, rowMode: 'array'}
        : {...sql, rowMode: 'array'};
    }

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
    return _queryArgs('ROLLBACK', []);
  };

  query._end = () => {
    const queryArgs = _queryArgs;
    _queryArgs = () => { throw new Error('Client was released.'); };
    return new Promise((resolve) => {
      if (inQuery)
        throw new Error(
          'Client shutting down but query is pending. ' +
          'Do you forget `await`?');

      if (query.inTransaction) {
        query.inTransaction = false;
        queryArgs('ROLLBACK', []);
        throw new Error('Transaction started manually but not closed. Automatic rollback');
      }
      resolve();
    });
  };

  return query;
};

export default makeAsyncApi;
