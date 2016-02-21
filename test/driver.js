import {expect} from 'chai';
import Pg from '../src/index';

describe('pg-async driver', () => {
  it('should be `pg` module by default', () => {
    expect(new Pg().getDriver()).to.be.equal(require('pg'));
  });

  it('should be `pg` module by if "pg" string used', () => {
    expect(new Pg(null, '').getDriver()).to.be.equal(require('pg'));
    expect(new Pg(null, 'pg').getDriver()).to.be.equal(require('pg'));
  });

  it('should be `pg.native` module by if "native" string used', () => {
    expect(new Pg(null, 'native').getDriver()).to.be.equal(require('pg').native);
    expect(new Pg(null, 'pg.native').getDriver()).to.be.equal(require('pg').native);
  });

  it('should throw if unknown driver used', () => {
    expect(() => new Pg(null, 'horse')).to.throw(Error);
  });
});
