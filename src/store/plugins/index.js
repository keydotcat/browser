/**
 * The file enables `@/store/index.js` to import all vuex plugins
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', false, /\.js$/);
const plugins = [];

files.keys().forEach(key => {
  if (key === './index.js') return;
  plugins.push(files(key).default);
});

export default plugins;
