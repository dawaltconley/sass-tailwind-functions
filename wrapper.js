const sass = require('sass');
const { List, OrderedMap } = require('immutable');
const { fromSass, toSass } = require('sass-cast');
const { toSass } = require('sass-cast/legacy');

const toLegacy = (sassValue) =>
  toSass(fromSass(sassValue), {
    parseUnquotedStrings: true,
    quotes: null,
  });
const toModern = (sassValue) => sassValue.dartValue ?? sassValue;

const toLegacy2 = (object) => {
  if (object === sass.NULL || object instanceof sass.SassBoolean) {
    return object;
  }
  if (object instanceof sass.SassNumber) {
    const n = object.numeratorUnits.join('*');
    const d = object.denominatorUnits.join('*');
    const unit = d && n ? `${n}/${d}` : d ? `(${d})^-1` : n;
    return new sass.types.Number(object.value, unit);
  }
  if (object instanceof sass.SassColor) {
    return new sass.types.Color(
      object.red,
      object.green,
      object.blue,
      object.alpha,
    );
  }
  if (object instanceof sass.SassString) {
    return new sass.types.String(object.getValue());
  }
  if (object instanceof sass.SassList || List.isList(object)) {
    const list = new sass.types.List(
      object.asList.size,
      object.separator === ',',
    );
    for (
      let i = 0, value = object.get(i);
      value !== undefined;
      i++, value = object.get(i)
    ) {
      list.setValue(i, toLegacy2(value));
    }
    return list;
  }
  if (object instanceof sass.SassMap) {
    const map = new sass.types.Map(object.contents.size);
    object.contents.toArray().forEach(([k, v], i) => {
      map.setKey(i, toLegacy2(k));
      map.setValue(i, toLegacy2(v));
    });
    return map;
  }
  return object.NULL;
};

module.exports = (functions) => {
  return Object.entries(functions).reduce((modern, [name, fn]) => {
    return {
      ...modern,
      [name]: (args) => toModern(fn(...args.map(toLegacy))),
    };
  }, {});
};
