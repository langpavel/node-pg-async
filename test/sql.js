import { expect } from 'chai';
import { SQL, literal } from '../src';

describe('pg-async SQL template tag', () => {
  it('parse without args', () => {
    const sql = SQL`SELECT * FROM test`;
    expect(sql.text).equal('SELECT * FROM test');
    expect(sql.values.length).equal(0);
    expect(sql.toString()).equal('SELECT * FROM test');
  });

  it('parse with custom formater arg', () => {
    const value1 = {
      toPostgres() {
        return 'raw text value';
      },
    };
    const sql = SQL`SELECT ${value1}`;
    expect(sql.text).equal('SELECT $1');
    expect(sql.values.length).equal(1);
    expect(sql.values[0]).equal(value1);
    expect(sql.toString()).equal("SELECT 'raw text value'");
    // cover caching
    expect(sql.toString()).equal("SELECT 'raw text value'");
  });

  it('parse with null arg', () => {
    const value1 = null;
    const sql = SQL`SELECT ${value1}`;
    expect(sql.text).equal('SELECT $1');
    expect(sql.values.length).equal(1);
    expect(sql.values[0]).equal(null);
    expect(sql.toString()).equal('SELECT NULL');
    // cover caching
    expect(sql.toString()).equal('SELECT NULL');
  });

  it('parse literal transform with null arg', () => {
    const value1 = null;
    const sql = SQL`SELECT $${value1}`;
    expect(sql.text).equal('SELECT NULL');
    expect(sql.values.length).equal(0);
    expect(sql.toString()).equal('SELECT NULL');
  });

  it('parse literal transform with string arg', () => {
    const value1 = 'ABC';
    const sql = SQL`SELECT $${value1}`;
    expect(sql.text).equal("SELECT 'ABC'");
    expect(sql.values.length).equal(0);
    expect(sql.toString()).equal("SELECT 'ABC'");
  });

  it('parse nested literal transform arg', () => {
    const value1 = SQL`${'ABC'}`;
    const sql = SQL`SELECT $${value1}`;
    expect(sql.text).equal('SELECT $1');
    expect(sql.values.length).equal(1);
    expect(sql.values[0]).equal('ABC');
    expect(sql.toString()).equal("SELECT 'ABC'");
  });

  it('parse with SQL formater arg', () => {
    const value1 = {
      toSQL() {
        return SQL`123.45::numeric(15,2)`;
      },
    };
    const sql = SQL`SELECT ${value1}`;
    expect(sql.text).equal('SELECT 123.45::numeric(15,2)');
    expect(sql.values.length).equal(0);
    expect(sql.toString()).equal('SELECT 123.45::numeric(15,2)');
  });

  it('parse with nested SQL', () => {
    const ip = '127.0.0.1';
    const login = 'langpavel';
    const userIdSql = SQL`(select id from user where login = ${login})`;
    const auditSql = SQL`insert into audit (uder_id, ip) values (${userIdSql}, ${ip})`;

    expect(userIdSql.text).equal('(select id from user where login = $1)');
    expect(userIdSql.values.length).equal(1);
    expect(userIdSql.values[0]).equal(login);

    expect(auditSql.text).equal(
      'insert into audit (uder_id, ip) values ((select id from user where login = $1), $2)',
    );
    expect(auditSql.values.length).equal(2);
    expect(auditSql.values[0]).equal(login);
    expect(auditSql.values[1]).equal(ip);
  });

  it('transform name', () => {
    const sql = SQL.transform('name', 'test "identifier"');
    expect(sql.toString()).equal('"test ""identifier"""');
  });

  it('parse with transform', () => {
    const table = 'address';
    const sql = SQL`select * from $name${table}`;
    expect(sql.text).equal('select * from "address"');
    expect(sql.values.length).equal(0);
  });

  it('parse with raw transform', () => {
    const table = 'address';
    const sql = SQL`select * from $!${table}`;
    expect(sql.text).equal('select * from address');
    expect(sql.values.length).equal(0);
  });

  it('parse with insert_object transform', () => {
    const data = {
      id: 123,
      val: 'abc',
    };
    const sql = SQL`INSERT INTO t $insert_object${data}`;
    expect(sql.text).equal('INSERT INTO t ("id","val") VALUES ($1,$2)');
    expect(sql.values.length).equal(2);
    expect(sql.values[0]).equal(123);
    expect(sql.values[1]).equal('abc');
  });

  it('SQL not nesting if ensuring SQL', () => {
    const sql1 = SQL`${'Value'}`;
    const sql2 = SQL(sql1);
    expect(sql1).equal(sql2);
  });

  it('SQL literal custom SQL transform', () => {
    const val = {
      toSQL() {
        return 'DEFAULT';
      },
    };
    const sql = SQL`insert... ($${val})`;
    expect(sql.text).equal('insert... (DEFAULT)');
    expect(sql.values.length).equal(0);
    expect(sql.toString()).equal('insert... (DEFAULT)');
  });
});

describe('pg-async SQL errors', () => {
  it('throws on unknown transform', () => {
    expect(() => SQL`SELECT * FROM $bleh${'something'}`).throws(Error);
  });

  it('throws on empty string', () => {
    expect(() => SQL`SELECT * FROM $ID${''}`).throws(Error);
  });

  it('throws on nonstring raw transform', () => {
    expect(() => SQL`SELECT * FROM $RAW${null}`).throws(Error);
  });

  it('throws on re-registering transform', () => {
    expect(() => {
      SQL.registerTransform('Id', val => val);
    }).throws(Error);
  });

  it('throws on registering nonfunction transform', () => {
    expect(() => {
      SQL.registerTransform('dummy', null);
    }).throws(Error);
  });

  it('throws on passing undefined', () => {
    const data = {};
    expect(() => SQL`update mytable set myvalue = ${data.mistyped}`).throws(
      Error,
    );
  });

  it('throws on transforming undefined', () => {
    let undef;
    expect(() => SQL`SELECT * FROM $ID${undef}`).throws(Error);
    expect(() => SQL`SELECT * FROM $${undef}`).throws(Error);
    expect(() => literal(undef)).throws(Error);
  });
});
