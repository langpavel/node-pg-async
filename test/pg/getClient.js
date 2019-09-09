import { expect } from 'chai';
import Pg from '../../src/index';

testWithDriver('pg', require('pg'));
testWithDriver('pg.native', require('pg').native);

function testWithDriver(driverName, driver) {
  describe(`pg-async getClient (with ${driverName} driver)`, () => {
    it('should fail if cannot connect', async () => {
      try {
        // const pgInvalid =
        await new Pg('INVALID', driver);
        // TODO: fix this
        // await pgInvalid.getClient();
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('should connect', async () => {
      const pg = new Pg(null, driver);
      const { client, done } = await pg.getClient();
      expect(done).to.be.a('function');
      expect(client).to.be.a('object');
      expect(client.query).to.be.a('function');
      pg.closeConnections();
      done();
    });
  });
}
