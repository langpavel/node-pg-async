import {expect} from 'chai';
import * as pg from '../../src/index';
import PgMock from './pgMock';

describe('pg-async connect (with mock driver)', () => {

  beforeEach(() => {
    pg.driver(new PgMock);
  });

  it('should fail if invalid connection conf', async () => {
    try {
      await pg.connect('INVALID', async () => null);
    } catch (err) {
      expect(pg.driver().connections).to.be.equal(0);
      expect(err).to.be.instanceOf(Error);
    }
  });

  it('should fail if invalid callback', async () => {
    try {
      await pg.connect('INVALID');
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
    }
  });

  it('should release connection', async () => {
    await pg.connect('VALID', async () => {
      expect(pg.driver().connections).to.be.equal(1);
      return null;
    });
    expect(pg.driver().connections).to.be.equal(0);
  });

  it('should release connection on client error', async () => {
    try {
      await pg.connect('VALID', async () => {
        expect(pg.driver().connections).to.be.equal(1);
        throw new Error('CustomError');
      });
    } catch(err) {
      expect(err.message).to.be.equal('CustomError');
    }
    expect(pg.driver().connections).to.be.equal(0);
  });

  describe('method', () => {
    it('query works', async () => {
      await pg.connect('VALID', async (q) => {
        expect(pg.driver().connections).to.be.equal(1);

        const row = await q('ROW');
        expect(row.rows).to.have.length(1);

        const rows = await q('ROWS');
        expect(rows.rows).to.have.length(2);

        const none = await q('NONE');
        expect(none.rows).to.have.length(0);

        try {
          await q('INVALID');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        expect(pg.driver().connections).to.be.equal(1);
      });
      expect(pg.driver().connections).to.be.equal(0);
    });

    it('query.query works', async () => {
      await pg.connect('VALID', async (q) => {
        expect(pg.driver().connections).to.be.equal(1);

        const row = await q.query('ROW');
        expect(row.rows).to.have.length(1);

        const rows = await q.query('ROWS');
        expect(rows.rows).to.have.length(2);

        const none = await q.query('NONE');
        expect(none.rows).to.have.length(0);

        try {
          await q.query('INVALID');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        expect(pg.driver().connections).to.be.equal(1);
      });
      expect(pg.driver().connections).to.be.equal(0);
    });

    it('query.rows works', async () => {
      await pg.connect('VALID', async (q) => {
        expect(pg.driver().connections).to.be.equal(1);

        const row = await q.rows('ROW');
        expect(row).to.have.length(1);

        const rows = await q.rows('ROWS');
        expect(rows).to.have.length(2);

        const none = await q.rows('NONE');
        expect(none).to.have.length(0);

        try {
          await q.rows('INVALID');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        expect(pg.driver().connections).to.be.equal(1);
      });
      expect(pg.driver().connections).to.be.equal(0);
    });

    it('query.row works', async () => {
      await pg.connect('VALID', async (q) => {
        expect(pg.driver().connections).to.be.equal(1);

        const row = await q.row('ROW');
        expect(row).to.be.a('object');

        try {
          await q.row('ROWS');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        try {
          await q.row('NONE');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        try {
          await q.row('INVALID');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        expect(pg.driver().connections).to.be.equal(1);
      });
      expect(pg.driver().connections).to.be.equal(0);
    });

    it('query.value works', async () => {
      await pg.connect('VALID', async (q) => {
        expect(pg.driver().connections).to.be.equal(1);

        const value = await q.value('VALUE');
        expect(value).to.be.equal('value');

        try {
          await q.value('ROW');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        try {
          await q.value('ROWS');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        try {
          await q.value('NONE');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        try {
          await q.value('INVALID');
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }

        expect(pg.driver().connections).to.be.equal(1);
      });
      expect(pg.driver().connections).to.be.equal(0);
    });

    it('rows - shorthand works', async () => {
      expect(pg.driver().connections).to.be.equal(0);
      const row = await pg.rows('ROW', null, 'VALID');
      expect(row).to.have.length(1);
      expect(pg.driver().connections).to.be.equal(0);
      const rows = await pg.rows('ROWS');
      expect(rows).to.have.length(2);
      expect(pg.driver().connections).to.be.equal(0);
      const none = await pg.rows('NONE');
      expect(none).to.have.length(0);
      expect(pg.driver().connections).to.be.equal(0);
    });

  });

});
