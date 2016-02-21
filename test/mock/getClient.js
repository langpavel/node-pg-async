import {expect} from 'chai';
import Pg from '../../src/index';
import PgMock, {Client} from './pgMock';

describe('pg-async getClient (with mock driver)', () => {

  let pg, pgInvalid;

  beforeEach(() => {
    pg = new Pg(null, new PgMock);
    pgInvalid = new Pg('INVALID', new PgMock);
  });

  it('should fail if cannot connect', async () => {
    try {
      await pgInvalid.getClient();
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
    }
  });

  it('should connect', async () => {
    const {client, done} = await pg.getClient();
    expect(client).to.be.instanceOf(Client);
    expect(done).to.be.a('function');
  });

});
