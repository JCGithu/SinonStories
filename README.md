## Sinon Stories

Sinon Stories is a simple Instagram Stories downloader module.

You will need to provide a cookie.txt file for your login, target usernames to download, and a download directory.

#### To Install

`npm i sinon-stories`

#### To run

You will need to input your username, password, and a cookie file from [Instagram](https://instagram.com) while you are logged in. You can obtain this through a few browser extensions.

```JS
sinonStories({
  username: 'coolinfluencer420',
  password: '1234Password',
  targetAccount: 'jack.c.gracie',
  targetDir: './',
  cookieFile: './cookie.txt',
});
```

### Additional options

> - `only_video: true` // Will download only video
> - `only_photo: true` // Will download only photos
> - `print: true` // Will only print story URLs

### Examples

Sinon Stories is async. Below is an example usage.

```JS
sinonStories({
  username: 'coolinfluencer420',
  password: '1234Password',
  targetAccount: 'jack.c.gracie',
  targetDir: './',
  cookieFile: './cookie.txt',
  print: true,
  only_video: true
}).then((storyURLS) => {
  console.log(storyURLS)
});
```
