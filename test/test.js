const sinonStories = require('../index.js');
require('dotenv').config();

sinonStories({
  username: process.env.U,
  password: process.env.P,
  targetAccount: process.env.T,
  targetDir: './',
  //cookieFile: './test/cookie.txt',
  verbose: true,
})
  .catch((err) => {
    console.log(err);
  })
  .then((array) => {
    console.log('finished');
    if (array) {
      console.log(array);
    }
  });
