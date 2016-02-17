import {expect} from 'chai';
import * as pg from '../src/index';

describe('pg-async exports', () => {
  it('driver', () => expect(pg.driver).to.be.a('function'));
  it('closeConnections', () => expect(pg.closeConnections).to.be.a('function'));
  it('getClient', () => expect(pg.closeConnections).to.be.a('function'));
  it('connect', () => expect(pg.closeConnections).to.be.a('function'));
  it('query', () => expect(pg.query).to.be.a('function'));
  it('rows', () => expect(pg.rows).to.be.a('function'));
  it('row', () => expect(pg.row).to.be.a('function'));
  it('value', () => expect(pg.value).to.be.a('function'));
  it('closeConnections', () => expect(pg.closeConnections).to.be.a('function'));
});
