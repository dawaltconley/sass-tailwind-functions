const { List, OrderedMap } = require('immutable');
const sass = require('sass');
// const { fromSass } = require('sass-cast');
// const { toSass } = require('sass-cast/legacy');
const escapeClassName =
  require('tailwindcss/lib/util/escapeClassName').default;

const sassThemeFn = require('./index');

// const toLegacy = (sassValue) =>
//   toSass(fromSass(sassValue), {
//     parseUnquotedStrings: true,
//     quotes: null,
//   });
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
    return new sass.types.String(object.text);
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
module.exports = (sass, tailwindConfig) => {
  const functions = sassThemeFn(sass, tailwindConfig);
  const [[themeFnKey, themeFn], [screenFnKey, screenFn], [escapeFnKey]] =
    Object.entries(functions);
  const newFunctions = {
    [themeFnKey]: (args) => toModern(themeFn(...args.map(toLegacy2))),
    [screenFnKey]: (args) => toModern(screenFn(...args.map(toLegacy2))),
    [escapeFnKey]: ([str]) => new sass.SassString(escapeClassName(str.text)),
  };
  return newFunctions;
};
