const Instagram = require('./lib/ig');
const fs = require('fs');
let { Cookie, CookieMap, CookieError } = require('cookiefile');

//const esmImport = require('esm')(module);
//const { fetch } = esmImport('node-fetch-cookies');

//const fetch = require('node-fetch');

const nodeFetch = require('node-fetch');
const fetch = require('fetch-cookie')(nodeFetch);

async function produceCookie(file) {
  if (file) {
    var cookies = new CookieMap(file);
    return cookies.toRequestHeader().replace('Cookie: ', '');
  } else {
    return false;
  }
}

async function sinonStories(options) {
  if (options.targetAccount && options.targetDir) {
    return new Promise(async (resolve) => {
      var { username, password, language, proxy, cookieFile } = options;
      if (options.cookieFile) {
        cookieFile = await produceCookie(options.cookieFile);
      }

      var client = new Instagram({ username, password, cookieFile, language, proxy });
      try {
        await client.login();
      } catch (err) {
        if (options.verbose) {
          console.log(err);
        }
        throw new Error('Login error, check cookie file.');
      }

      const storyItems = await client.getStoryItemsByUsername({
        username: options.targetAccount,
      });

      var dir = `${options.targetDir}${options.targetAccount}/`;

      if (!fs.existsSync(dir) && !options.print) {
        fs.mkdirSync(dir);
      }

      let downNumb = 0;
      let printArray = [];

      for (let i = 0; i < storyItems.length; i++) {
        let filetype = '';
        const imageData = new Promise(async (res) => {
          async function getURL() {
            if (storyItems[i].is_video) {
              let video = storyItems[i].video_resources;
              let URLdata = {
                filetype: '.mp4',
                URL: video[video.length - 1].src,
              };
              return URLdata;
            } else {
              filetype = '.jpg';
              let picture = storyItems[i].display_resources;
              let URLdata = {
                filetype: '.jpg',
                URL: picture[picture.length - 1].src,
              };
              return URLdata;
            }
          }
          let URLdata = await getURL();
          const response = await fetch(URLdata.URL);
          const buffer = await response.buffer();

          let fileName = `${options.targetAccount}_${i}`;

          async function download() {
            fs.writeFile(dir + fileName + URLdata.filetype, buffer, () => {});
          }

          function runDownload() {
            download()
              .catch(console.error)
              .then(() => {
                res();
              });
          }

          if (options.print) {
            if (
              (options.only_video && URLdata.filetype == '.mp4') ||
              (options.only_photo && URLdata.filetype == '.jpg') ||
              (!options.only_photo && !options.only_video)
            ) {
              printArray.push(URLdata.URL);
            }
            res(printArray);
          } else {
            if (options.only_video) {
              if (URLdata.filetype == '.mp4') {
                runDownload();
              }
            } else if (options.only_photo) {
              if (URLdata.filetype == '.jpg') {
                runDownload();
              }
            } else {
              runDownload();
            }
          }
        });

        imageData.then((printArray) => {
          downNumb++;
          if (downNumb == storyItems.length) {
            if (printArray) {
              resolve(printArray);
            } else {
              resolve();
            }
          }
        });
      }
    });
  } else {
    throw new Error('Input variable missing');
  }
}

module.exports = sinonStories;
