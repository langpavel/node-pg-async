import { expect } from 'chai';
import Pg from '../../src/index';

describe('pg shortcuts', () => {
  const pg = new Pg();

  after(() => {
    pg.closeConnections();
  });

  it('query works', async () => {
    const result = await pg.query(
      pg.SQL`SELECT ${123}::int as int, ${'abc'}::text as text`,
    );
    expect(result).to.be.a('object');
    expect(result.rows).to.be.a('array');
    expect(result.rows).lengthOf(1);
    expect(result.rows[0]).to.be.a('object');
    expect(result.rows[0].int).equal(123);
    expect(result.rows[0].text).equal('abc');
    expect(result.fields).to.be.a('array');
    expect(result.fields).lengthOf(2);
    expect(result.fields[0]).to.be.a('object');
    expect(result.fields[0].name).equal('int');
    expect(result.fields[1].name).equal('text');
  });

  it('queryArgs works', async () => {
    const result = await pg.queryArgs(
      pg.SQL`SELECT ${123}::int as int, ${'abc'}::text as text`,
    );
    expect(result).to.be.a('object');
    expect(result.rows).to.be.a('array');
    expect(result.rows).lengthOf(1);
    expect(result.rows[0]).to.be.a('object');
    expect(result.rows[0].int).equal(123);
    expect(result.rows[0].text).equal('abc');
    expect(result.fields).to.be.a('array');
    expect(result.fields).lengthOf(2);
    expect(result.fields[0]).to.be.a('object');
    expect(result.fields[0].name).equal('int');
    expect(result.fields[1].name).equal('text');
  });
});
