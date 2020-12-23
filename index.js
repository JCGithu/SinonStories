const Instagram = require('./lib/ig');
const fs = require('fs');
const { promisify } = require('util');
const stream = require('stream');
const got = require('got');
const FileCookieStore = require('tough-cookie-filestore2');

async function sinonStories(options) {
  if (options.targetAccount && options.targetDir && options.cookieFile) {
    return new Promise(async (resolve) => {
      const cookieStore = new FileCookieStore(options.cookieFile);
      let username = options.username;
      let password = options.password;
      let language, proxy;
      if (options.language) {
        language = options.language;
        const client = new Instagram({ username, password, cookieStore }, { language });
      }
      if (options.proxy) {
        proxy = options.proxy;

        /// PROXY Options
      }
      const client = new Instagram({ username, password, cookieStore });
      try {
        await client.login();
      } catch (err) {
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

          let fileName = `${options.targetAccount}_${i}`;

          const pipeline = promisify(stream.pipeline);

          async function download() {
            await pipeline(got.stream(URLdata.URL), fs.createWriteStream(dir + fileName + URLdata.filetype));
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
