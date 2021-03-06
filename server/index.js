"use strict";

global.navigator = {userAgent: false};

process.on("SIGINT", () => {
  process.exit(0);
});

const config = require("electrode-confippet").config;
const staticPathsDecor = require("electrode-static-paths");
const supports = require("electrode-archetype-react-app/supports");
const statsUtils = require("../lib/stats-utils");

/**
 * Use babel register to transpile any JSX code on the fly to run
 * in server mode, and also transpile react code to apply process.env.NODE_ENV
 * removal to improve performance in production mode.
 */
supports.babelRegister({
  ignore: /node_modules\/(?!react\/)/
});

/**
 * css-modules-require-hook: handle css-modules on node.js server.
 * similar to Babel's babel/register it compiles CSS modules in runtime.
 *
 * generateScopedName - Short alias for the postcss-modules-scope plugin's option.
 * Helps you to specify the custom way to build generic names for the class selectors.
 * You may also use a string pattern similar to the webpack's css-loader.
 *
 * https://github.com/css-modules/css-modules-require-hook#generatescopedname-function
 * https://github.com/webpack/css-loader#local-scope
 * https://github.com/css-modules/postcss-modules-scope
 */
supports.cssModuleHook({
  generateScopedName: "[name]__[local]___[hash:base64:5]"
});

require("electrode-server")(config, [staticPathsDecor()])
  .then((server) => {
    server.route({
      method: "GET",
      path: "/reporter",
      handler: (req, reply) => {
        const stats = require("./stats_err.json"); // eslint-disable-line
        const byPkg = statsUtils.getModulesByPkg(stats);

        const data = {
          info: statsUtils.getInfo(stats),
          assets: statsUtils.getAssets(stats),
          modulesByPkg: byPkg.modulesByPkg,
          totalSizeByPkg: byPkg.totalSize,
          warnings: statsUtils.getWarningsHtml(stats),
          errors: statsUtils.getErrorsHtml(stats),
          legacy: statsUtils.jsonToHtml(stats, true)
        };
        reply(data);
      }
    });

    server.route({
      method: "GET",
      path: "/reporter/legacy",
      handler: (req, reply) => {
        const stats = require("./../test/stats_err.json");  // eslint-disable-line
        reply({
          legacy: statsUtils.jsonToHtml(stats)
        });
      }
    });
  });
