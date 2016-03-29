import Promise from 'bluebird';
import pgDriver from 'pg';
import debug from './debug';
import makeAsyncApi from './makeAsyncApi';
import SqlTag from './sql';

export {sqlStr, literal, identifier} from './sql';
export const SQL = SqlTag;

function checkAsyncFunction(asyncFunc) {
  if (typeof asyncFunc !== 'function')
    throw new TypeError('async function expected');
}

export default class PgAsync {
  constructor(connectionOptions, driver) {
    this.setConnectionOptions(connectionOptions);
    this.setDriver(driver);

    const wrap = name => {
      this[name] = (sql, ...values) =>
        this.connect(client => client[`${name}Args`](sql, values));
    };
    const wrapArgs = name => {
      this[name] = (sql, values) =>
        this.connect(client => client[name](sql, values));
    };

    wrap('query');
    wrapArgs('queryArgs');

    wrap('rows');
    wrapArgs('rowsArgs');

    wrap('row');
    wrapArgs('rowArgs');

    wrap('value');
    wrapArgs('valueArgs');
  }

  static SQL = SqlTag;
  SQL = SqlTag;

  setConnectionOptions(options) {
    this._connectionOptions = options;
    return this;
  }

  getConnectionOptions() {
    return this._connectionOptions || this.getDriver().defaults;
  }

  getDriver() {
    return this._driver;
  }

  setDriver(driver) {
    if (typeof driver === 'string')
      switch (driver) {
        case '': case 'pg':
          driver = pgDriver;
          break;
        case 'native': case 'pg.native':
          driver = pgDriver.native;
          break;
        default:
          throw new Error(`Unrecognized driver name: ${driver}`);
      }
    this._driver = driver || pgDriver;
    return this;
  }

  async getClient() {
    return new Promise((resolve, reject) => {
      this.getDriver().connect(this.getConnectionOptions(), (err, client, done) => {
        if (err) {
          debug('%s getClient(%j)', err, this.getConnectionOptions());
          if (done) done(err);
          return reject(err);
        }
        return resolve({
          client,
          done: () => {
            debug('Client released');
            done();
          }
        });
      });
    });
  }

  async connect(asyncFunc) {
    checkAsyncFunction(asyncFunc);

    const {client, done} = await this.getClient();
    try {
      const api = makeAsyncApi(client);
      const result = await asyncFunc(api);
      await api._end();
      done();
      return result;
    } catch (err) {
      done(err);
      throw err;
    }
  }

  async transaction(asyncFunc) {
    checkAsyncFunction(asyncFunc);

    return await this.connect(async (client) => {
      client.checkSerialAccess = true;
      await client.startTransaction();
      try {
        const result = await asyncFunc(client);
        await client.commit();
        return result;
      } catch (err) {
        try {
          await client.rollback();
        } catch (_) {
          // client disconnected?
        }
        throw err;
      }
    });
  }

  closeConnections = () => this.getDriver().end();

}
