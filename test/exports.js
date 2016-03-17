import {expect} from 'chai';
import Pg from '../src/index';

const pg = new Pg;

describe('pg-async exports', () => {
  it('pgAsync', () => expect(Pg).to.be.a('function'));
});

describe('pg-async client', () => {
  it('getDriver', () => expect(pg.getDriver).to.be.a('function'));
  it('getClient', () => expect(pg.closeConnections).to.be.a('function'));
  it('connect', () => expect(pg.closeConnections).to.be.a('function'));
  it('query', () => expect(pg.query).to.be.a('function'));
  it('queryArgs', () => expect(pg.query).to.be.a('function'));
  it('rows', () => expect(pg.rows).to.be.a('function'));
  it('rowsArgs', () => expect(pg.rows).to.be.a('function'));
  it('row', () => expect(pg.row).to.be.a('function'));
  it('rowArgs', () => expect(pg.row).to.be.a('function'));
  it('value', () => expect(pg.value).to.be.a('function'));
  it('valueArgs', () => expect(pg.value).to.be.a('function'));
  it('closeConnections', () => expect(pg.closeConnections).to.be.a('function'));
  it('SQL', () => expect(pg.SQL).to.be.a('function'));
});
