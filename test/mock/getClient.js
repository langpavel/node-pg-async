import {expect} from 'chai';
import * as pg from '../../src/index';
import PgMock, {Client} from './pgMock';

describe('pg-async getClient (with mock driver)', () => {

  beforeEach(() => {
    pg.driver(new PgMock);
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
    expect(client).to.be.instanceOf(Client);
    expect(done).to.be.a('function');
  });

});
