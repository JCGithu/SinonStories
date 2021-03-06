# Sinon Stories

Sinon Stories is a simple Instagram Stories downloader module.

This is linked to [Sinon](https://github.com/JCGithu/sinon) a video downloading & converting app.

### To Install

`npm i sinon-stories`

### To run

You will need to input your username, and password. There is a much greater chance of a successful login if you include a cookie file from [Instagram](https://instagram.com) while you are logged in. You can obtain this through a few browser extensions.

```JS
sinonStories({
  username: 'coolinfluencer420',
  password: '1234Password',
  targetAccount: 'jack.c.gracie',
  targetDir: './',
  cookieFile: './cookie.txt',
});
```

## Additional options

> - `only_video: boolean` // Will download only video
> - `only_photo: boolean` // Will download only photos
> - `print: boolean` // Will only print story URLs
> - `proxy: string` // Use proxy
> - `language: string` // Set language
> - `verbose: boolean` // Print error in full

## Examples

Sinon Stories is async. Below is an example usage.

```JS
const sinonStories = require('sinon-stories');

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

## Future improvements

- Reducing dependencies
- Highlights download
