
import {inspect} from 'util';
import pg from 'pg';

export class SqlFragment {

  // SQL`insert into $quote${tableName} $values${keyValue}`;
  constructor(templateParts, templateValues) {
    this._parts = [];
    this.values = [];

    const length = templateValues.length;
    const text = [];
    let currentFragment = [];
    let argIndex = 1;

    let i = 0;

    const addText = (str) => {
      currentFragment.push(str);
    };

    const flushText = () => {
      const fragment = currentFragment.join('');
      currentFragment = [];
      this._parts.push(fragment);
      text.push(fragment);
    };

    const addValue = (value) => {
      flushText();
      this.values.push(value);
      text.push('$', argIndex++);
    };

    while (i < length) {
      const parts = templateParts[i].split('$');
      let value = templateValues.shift();

      while (parts.length > 1)
        value = SQL.transform(parts.pop(), value);

      addText(parts[0]);

      if (value && value.toSQL)
        value = value.toSQL();

      if (value instanceof SqlFragment) {
        const nestedValuesLength = value.values.length;
        let valueIndex = 0;
        while (valueIndex < nestedValuesLength) {
          addText(value._parts[valueIndex]);
          addValue(value.values[valueIndex]);
          valueIndex++;
        }
        addText(value._parts[valueIndex]);
      } else {
        addValue(value);
      }
      i++;
    }
    // last part is alone, without value
    addText(templateParts[i]);
    flushText();

    this.text = text.join('');
  }

  // this is for log/debugging only
  toString() {
    if (this._asString)
      return this._asString;

    const text = [];
    const length = this.values.length;
    let i = 0;
    while (i < length) {
      text.push(this._parts[i]);
      const value = literal(this.values[i]);
      text.push(value);
      i++;
    }
    text.push(this._parts[i]);
    this._asString = text.join('');
    return this._asString;
  }
}

let SQL = (parts, ...values) => {
  // only one argument, called manually
  if (!Array.isArray(parts) && values.length === 0) {
    if (parts instanceof SqlFragment)
      return parts;

    parts = [parts];
  }

  return new SqlFragment(parts, values);
};

SQL.NULL = SQL('NULL');
SQL.DEFAULT = SQL('DEFAULT');

SQL._transforms = {};
SQL.registerTransform = (...names) => {
  const transform = names.pop();
  if (typeof transform !== 'function')
    throw new Error('Last argument must be a function');

  const transforms = SQL._transforms;
  for (let i = 0; i < names.length; i++) {
    const name = names[i].trim().toLowerCase();
    if (transforms[name] && transforms[name] !== transform)
      throw new Error(`Transform ${name} already registered`);
    transforms[names[i].toLowerCase()] = transform;
  }
};

SQL.transform = (name, value) => {
  name = name.trim().toLowerCase();
  const transform = SQL._transforms[name];
  if (!transform)
    throw new Error(`Unknown transform: "${name}"`);
  return transform(value);
};

export const escapeIdentifier = pg.Client.prototype.escapeIdentifier;
export const escapeLiteral = pg.Client.prototype.escapeLiteral;

export function sqlStr(str) {
  if (typeof str !== 'string')
    throw new Error(`Expected string, got ${inspect(str)}`);

  return SQL(str);
}

// returns quoted identifier
export function identifier(name) {
  if (!name)
    throw new Error(`Expected nonempty string, got ${inspect(name)}`);

  return SQL(escapeIdentifier(name));
}

// returns quoted identifier
export function literal(value) {
  if (value instanceof SqlFragment)
    return value;

  if (typeof value === 'undefined')
    throw new Error(`Expected something, but got undefined.`);

  if (value === null)
    return SQL.NULL;

  if (value.toPostgres)
    return SQL(escapeLiteral(value.toPostgres()));

  if (value.toSQL)
    return SQL(value.toSQL());

  return SQL(escapeLiteral(value.toString()));
}

export function insert_object(data) {
  const keys = Object.keys(data);
  const length = keys.length;
  const sqlFragments = new Array(length);
  const values = new Array(length - 1);
  const sb = [];

  sb.push('(');
  let i = 0;
  while (i < length) {
    const column = keys[i];
    values[i] = data[column];
    i++;
    sb.push(escapeIdentifier(column), ',');
    sqlFragments[i] = ',';
  }
  sb[sb.length - 1] = ') VALUES (';
  sqlFragments[0] = sb.join('');
  sqlFragments[i] = ')';

  return new SqlFragment(sqlFragments, values);
}

SQL.registerTransform('id', 'ident', 'identifier', 'name', identifier);
SQL.registerTransform('', 'literal', literal);
SQL.registerTransform('!', 'raw', sqlStr);
SQL.registerTransform('insert_object', 'insert', insert_object);

export default SQL;
