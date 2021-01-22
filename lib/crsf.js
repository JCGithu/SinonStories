const fetch = require('node-fetch');

const { useragentFromSeed, combineOptions } = require('./utils');

async function getCsrfToken() {
  return new Promise((resolve, reject) => {
    fetch('https://www.instagram.com', {
      method: 'get',
      headers: combineOptions({
        accept: 'text/html,application/xhtml+xml,application/xml;q0.9,image/webp,image/apng,*.*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        cookie: 'ig_cb=1',
      }),
    })
      .then((t) => {
        return t.text();
      })
      .then((html) => {
        var startStr = '<script type="text/javascript">window._sharedData = ';
        var start = html.indexOf(startStr) + startStr.length;
        html = html.substr(start, html.length);
        html = html.substr(0, html.indexOf('</script>') - 1);
        var json = JSON.parse(html);
        resolve(json.config.csrf_token);
      })
      .catch((err) => {
        console.log(err);
        console.log('Failed to get instagram csrf token');
        reject(err);
      });
  });
}

module.exports = getCsrfToken;
