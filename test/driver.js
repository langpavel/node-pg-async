import {expect} from 'chai';
import * as pg from '../src/index';

describe('pg-async driver', () => {
  beforeEach(() => { pg.driver(require('pg')); });

  it('should be `pg` module by default', () => expect(pg.driver()).to.be.equal(require('pg')));

  it('can be replaced', () => {
    const ref = {};
    const tmp = pg.driver(ref);
    expect(tmp).to.be.equal(require('pg'));
    expect(pg.driver()).to.be.equal(ref);
    pg.driver(tmp);
  });
});
