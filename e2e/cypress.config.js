const { defineConfig } = require("cypress");

module.exports = defineConfig({
  retries: {
    runMode: 2 // NOTE: Cold boot
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    experimentalOriginDependencies: true
  }
});
