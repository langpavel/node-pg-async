import {expect} from 'chai';
import Pg, {SQL} from '../../src/index';

const tableName = 'pgAsyncTest';
testWithDriver('pg', require('pg'));
testWithDriver('pg.native', require('pg').native);

function testWithDriver(driverName, driver) {
  describe(`pg-async SQL tag (with ${driverName} driver)`, () => {

    let pg;

    before(async () => {
      pg = new Pg(null, driver);
      await pg.query(SQL`
        CREATE TABLE IF NOT EXISTS $ID${tableName} (
          id serial,
          val integer
        )
      `);
    });

    after(async () => {
      try {
        await pg.query(SQL`DROP TABLE $ID${tableName}`);
      } catch (err) {
        // ignore
      }
      pg.closeConnections();
    });

    it('returns string value', async () => {
      const result = await pg.transaction((t) => t.value(SQL`SELECT ${'test'}::text`));
      expect(result).to.be.equal('test');
    });

    it('returns nested string value', async () => {
      const nested = SQL`${'test'}`;
      const result = await pg.transaction((t) => t.value(SQL`SELECT ${nested}::text`));
      expect(result).to.be.equal('test');
    });

    it('returns nested subquery value', async () => {
      const nested = SQL`(select ${'test'}::text)`;
      const result = await pg.transaction((t) => t.value(SQL`SELECT ${nested}`));
      expect(result).to.be.equal('test');
    });

    it('returns row', async () => {
      const result = await pg.transaction((t) => t.row(t.SQL`
        SELECT ${'test'}::text as t, ${123}::smallint as i
      `));
      expect(result.t).to.be.equal('test');
      expect(result.i).to.be.equal(123);
    });

  });
}
