export class Client {
  query(sql, values, cb) {
    setImmediate(() => {
      switch(sql.text || sql) {
        case 'ROWS':
          return cb(null, {rowCount: 2, rows: [{id:1, name:'A'}, {id:2, name:'B'}]});
        case 'ROW':
          return cb(null, {rowCount: 1, rows: [{id:1, name:'A'}]});
        case 'VALUE':
          return cb(null, {rowCount: 1, rows: [['value']]});
        case 'NONE':
          return cb(null, {rowCount: 0, rows: []});
        default:
          return cb(new Error('ERROR'));
      }
    });
  }
}

export default class PgMock {
  constructor() {
    this.connections = 0;
    this.defaults = {};
    this.done = this.done.bind(this);
  }

  connect(conString, cb) {
    if (conString === 'INVALID') {
      setImmediate(() => cb(new Error));
    } else {
      this.connections++;
      setImmediate(() => cb(null, new Client, this.done));
    }
  }

  end() {
    this.connections = 0;
  }

  done() {
    this.connections--;
  }
};
