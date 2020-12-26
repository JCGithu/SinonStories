// Native
const crypto = require('crypto');

// Packages
const request = require('request-promise-native');
const { Cookie } = require('tough-cookie');
const baseUrl = 'https://www.instagram.com';
const userAgents = require('./user-agents.json');

function useragentFromSeed() {
  let calculations = Math.floor(Math.random() * userAgents.length);
  return userAgents[calculations];
}

class Instagram {
  constructor({ username, password, cookieStore }, { language, proxy, requestOptions } = {}) {
    this.credentials = {
      username,
      password,
    };

    const jar = request.jar(cookieStore);
    jar.setCookie(request.cookie('ig_cb=1'), baseUrl);
    const { value: csrftoken } = jar.getCookies(baseUrl).find(({ key }) => key === 'csrftoken') || {};

    const userAgent = useragentFromSeed(username);
    if (requestOptions === undefined) {
      requestOptions = {};
    }
    requestOptions.baseUrl = baseUrl;
    requestOptions.uri = '';
    requestOptions.headers = {
      'User-Agent': userAgent,
      'Accept-Language': language || 'en-US',
      'X-Instagram-AJAX': 1,
      'X-CSRFToken': csrftoken,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: baseUrl,
    };
    requestOptions.proxy = proxy;
    requestOptions.jar = jar;
    requestOptions.json = true;
    this.request = request.defaults(requestOptions);
  }

  async login({ username, password } = {}, { _sharedData = true } = {}) {
    username = username || this.credentials.username;
    password = password || this.credentials.password;

    // Get CSRFToken from cookie before login
    let value;
    await this.request('/', { resolveWithFullResponse: true }).then((res) => {
      const pattern = new RegExp(/(csrf_token":")\w+/);
      const matches = res.toJSON().body.match(pattern);
      value = matches[0].substring(13);
    });

    // Provide CSRFToken for login or challenge request
    this.request = this.request.defaults({
      headers: { 'X-CSRFToken': value },
    });

    // Temporary work around for https://github.com/jlobos/instagram-web-api/issues/118
    const createEncPassword = (pwd) => {
      return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${pwd}`;
    };

    // Login
    const res = await this.request.post('/accounts/login/ajax/', {
      resolveWithFullResponse: true,
      form: { username, enc_password: createEncPassword(password) },
    });

    if (!res.headers['set-cookie']) {
      throw new Error('No cookie');
    }
    const cookies = res.headers['set-cookie'].map(Cookie.parse);

    // Get CSRFToken after successful login
    const { value: csrftoken } = cookies.find(({ key }) => key === 'csrftoken').toJSON();

    // Provide CSRFToken to request
    this.request = this.request.defaults({
      headers: { 'X-CSRFToken': csrftoken },
    });

    this.credentials = {
      username,
      password,
      // Add cookies to credentials
      cookies: cookies.map((cookie) => cookie.toJSON()),
    };

    // Provide _sharedData
    if (_sharedData) {
      this._sharedData = await this._getSharedData();
    }
    return res.body;
  }

  async _getSharedData(url = '/') {
    return this.request(url)
      .then((html) => html.split('window._sharedData = ')[1].split(';</script>')[0])
      .then((_sharedData) => JSON.parse(_sharedData));
  }

  async _getGis(path) {
    const { rhx_gis } = this._sharedData || (await this._getSharedData(path));

    return crypto.createHash('md5').update(`${rhx_gis}:${path}`).digest('hex');
  }

  async getUserByUsername({ username }) {
    return this.request({
      uri: `/${username}/?__a=1`,
      headers: {
        referer: baseUrl + '/' + username + '/',
        'x-instagram-gis': await this._getGis(`/${username}/`),
      },
    }).then((data) => data.graphql.user);
  }

  async getStoryReels({ reelIds = [], tagNames = [], locationIds = [], precomposedOverlay = false } = {}) {
    return this.request('/graphql/query/', {
      qs: {
        query_hash: '297c491471fff978fa2ab83c0673a618',
        variables: JSON.stringify({
          reel_ids: reelIds,
          tag_names: tagNames,
          location_ids: locationIds,
          precomposed_overlay: precomposedOverlay,
        }),
      },
    }).then((data) => data.data.reels_media);
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
