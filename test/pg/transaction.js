import {expect} from 'chai';
import Pg from '../../src/index';

testWithDriver('pg', require('pg'));
testWithDriver('pg.native', require('pg').native);

function testWithDriver(driverName, driver) {
  describe(`pg-async transaction (with ${driverName} driver)`, () => {

    let pg;

    before(async () => {
      pg = new Pg(null, driver);
      await pg.query(`
        CREATE TABLE IF NOT EXISTS pgAsyncTest (
          id serial,
          val integer
        )
      `);
    });

    beforeEach(() => {
      pg = new Pg(null, driver);
    });

    after(() => {
      pg.closeConnections();
    });

    it('returns value', async () => {
      const result = await pg.transaction((t) => t.value(`SELECT 'test'`));
      expect(result).to.be.equal('test');
    });

    it('commits', async () => {
      const random = Math.trunc(Math.random() * 1e9) + 1;
      let id;
      try {
        id = await pg.transaction(async (t) =>
          await t.value(`INSERT INTO pgAsyncTest (val) VALUES ($1) RETURNING id`, random)
        );
      } catch (err) {
      }
      const restored = await pg.row('select * from pgAsyncTest where id = $1', id);
      expect(restored.val).equal(random);
    });

    it('rollbacks', async () => {
      const random = Math.trunc(Math.random() * 1e9) + 1;
      let id;
      try {
        await pg.transaction(async (t) => {
          id = await t.value(`INSERT INTO pgAsyncTest (val) VALUES ($1) RETURNING id`, random);
          throw new Error('Test rollback');
        });
      } catch (err) {
      }
      const restoredRows = await pg.rows('select * from pgAsyncTest where id = $1', id);
      expect(restoredRows).lengthOf(0);
    });

    it('rollbacks uncommited', async () => {
      const random = Math.trunc(Math.random() * 1e9) + 1;
      let error, id;
      try {
        await pg.connect(async (t) => {
          await t.startTransaction();
          id = await t.value(`INSERT INTO pgAsyncTest (val) VALUES ($1) RETURNING id`, random);
        });
      } catch (err) {
        error = err;
      }
      expect(error).to.be.a('Error');
      const restoredRows = await pg.rows('select * from pgAsyncTest where id = $1', id);
      expect(restoredRows).lengthOf(0);
    });

  });
}
