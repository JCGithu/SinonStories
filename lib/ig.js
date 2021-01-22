//let { Cookie, CookieMap, CookieError } = require('cookiefile');
const baseURL = 'https://www.instagram.com';

const nodeFetch = require('node-fetch');
const tough = require('tough-cookie');
const FileCookieStore = require('tough-cookie-filestore2');
var Cookie = tough.Cookie;
const jar = new tough.CookieJar(new FileCookieStore('./cookie.json'));
const fetch = require('fetch-cookie')(nodeFetch, jar, false);

const crypto = require('crypto');

const getCsrfToken = require('./crsf');
const { useragentFromSeed, combineOptions } = require('./utils');

class Instagram {
  constructor({ username, password, cookieFile, language, proxy } = {}) {
    this.credentials = {
      username,
      password,
    };
    const userAgent = useragentFromSeed();

    const cookieErrorCb = (err) => {
      if (err) {
        console.log(err);
      }
    };

    let igCookie = new Cookie({
      domain: 'www.instagram.com',
      cookieName: 'ig_cb',
      path: '/',
      https: false,
      httpOnly: false,
      crossDomain: false,
      expire: 468875239,
      value: '2',
    });

    jar.setCookie(igCookie, baseURL, cookieErrorCb);
    const { value: csrftoken } = jar.getCookies(baseURL, cookieErrorCb).find(({ key }) => key === 'csrftoken') || {};

    //jar.getCookies(baseURL, cookieErrorCb);

    const requestHeaders = {
      'User-Agent': userAgent,
      'Accept-Language': language || 'en-US',
      'X-Instagram-AJAX': 1,
      'X-CSRFToken': csrftoken,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: baseURL,
    };

    this.requestOptions = {
      headers: requestHeaders,
      method: 'GET',
    };
    if (proxy) {
      this.requestOptions.proxy = proxy;
    }
  }

  async login({ username, password } = {}, { _sharedData = true } = {}) {
    username = username || this.credentials.username;
    password = password || this.credentials.password;

    let csrf = '';
    await fetch(baseURL).then((data) => {
      let info = data.headers.raw()['set-cookie'];
      stringyInfo = info.toString();
      csrf = stringyInfo.split('csrftoken=')[1].split(';')[0];
    });

    Object.assign(this.requestOptions.headers, {
      'X-CSRFToken': csrf,
    });

    // Temporary work around for https://github.com/jlobos/instagram-web-api/issues/118
    const createEncPassword = (pwd) => {
      return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${pwd}`;
    };

    this.requestOptions.form = {
      username,
      enc_password: createEncPassword(password),
    };
    this.requestOptions.method = 'POST';
    var set_cookie;

    // Login
    console.log(this.requestOptions);
    const res = await fetch('https://www.instagram.com/accounts/login/ajax/', this.requestOptions)
      .then((data) => {
        if (!data.headers.get('set-cookie')) {
          throw new Error('No cookie');
        } else {
          set_cookie = data.headers.get('set-cookie');
        }
        return data.text();
      })
      .then((text) => {
        console.log(text);
        return text;
      });

    // Get CSRFToken after successful login

    var newCSRF = set_cookie.split('csrftoken=')[1].split(';')[0];
    Object.assign(this.requestOptions.headers, {
      'X-CSRFToken': newCSRF,
    });

    // Provide _sharedData
    if (_sharedData) {
      this._sharedData = await this._getSharedData();
    }

    return res;
  }

  async _getSharedData() {
    return fetch('https://www.instagram.com/', this.requestOptions)
      .then((data) => data.text())
      .then((html) => html.split('window._sharedData = ')[1].split(';</script>')[0])
      .then((_sharedData) => JSON.parse(_sharedData));
  }

  async _getGis(path) {
    const { rhx_gis } = this._sharedData || (await this._getSharedData(path));
    return crypto.createHash('md5').update(`${rhx_gis}:${path}`).digest('hex');
  }

  async getUserByUsername({ username }) {
    this.requestOptions.headers.referer = baseURL + '/' + username + '/';
    Object.assign(this.requestOptions.headers, {
      'x-instagram-gis': await this._getGis(`/${username}/`),
    });
    this.requestOptions.method = 'GET';
    //console.log(this.requestOptions.headers);
    return fetch(`https://www.instagram.com/${username}/?__a=1`, this.requestOptions)
      .then((data) => {
        console.log(data);
        return data.text();
      })
      .then((json) => {
        //console.log(json);
        return json.graphql.user;
      });
  }

  async getStoryReels({ reelIds = [], tagNames = [], locationIds = [], precomposedOverlay = false } = {}) {
    const graphURL = baseURL + '/graphql/query/';
    const params = new URLSearchParams({
      query_hash: '297c491471fff978fa2ab83c0673a618',
      variables: JSON.stringify({
        reel_ids: reelIds,
        tag_names: tagNames,
        location_ids: locationIds,
        precomposed_overlay: precomposedOverlay,
      }),
    });
    let storyReelURL = graphURL + params;
    //console.log(storyReelURL);
    //console.log(this.requestOptions);
    return fetch(storyReelURL, this.requestOptions)
      .then((data) => data.json())
      .then((json) => {
        //console.log(json);
        //return json.graphql.user;
      });
  }

  async getStoryItemsByUsername({ username }) {
    const user = await this.getUserByUsername({ username });
    return this.getStoryItemsByReel({ reelId: user.id });
  }

  async getStoryItemsByReel({ reelId }) {
    const reels = await this.getStoryReels({ reelIds: [reelId] });
    if (reels.length === 0) return [];
    return reels[0].items;
  }
}

module.exports = Instagram;
