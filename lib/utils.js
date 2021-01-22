const userAgents = require('./user-agents.json');

function useragentFromSeed() {
  let calculations = Math.floor(Math.random() * userAgents.length);
  return userAgents[calculations];
}

function combineOptions(target, data) {
  return Object.assign(target, data);
}

module.exports = {
  useragentFromSeed,
  combineOptions,
};
