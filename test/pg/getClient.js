import {expect} from 'chai';
import * as pg from '../../src/index';

testWithDriver('pg', require('pg'));
testWithDriver('pg.native', require('pg').native);

function testWithDriver(driverName, driver) {
  describe(`pg-async getClient (with ${driverName} driver)`, () => {

    beforeEach(() => {
      pg.driver(driver);
      pg.setDefaultConnection(null);
    });

    after(() => {
      driver.end();
    });

    it('should fail if cannot connect', async () => {
      try {
        await pg.getClient('INVALID');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('should connect', async () => {
      const {client, done} = await pg.getClient();
      expect(done).to.be.a('function');
      expect(client).to.be.a('object');
      expect(client.query).to.be.a('function');
      done();
    });

  });
}
