# Sinon Stories

Sinon Stories is a simple Instagram Stories downloader module.

This is linked to [Sinon](https://github.com/JCGithu/sinon) a video downloading & converting app.

### To Install

`npm i sinon-stories`

### To run

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

## Additional options

> - `only_video: true` // Will download only video
> - `only_photo: true` // Will download only photos
> - `print: true` // Will only print story URLs
> - `proxy: string` // Use proxy
> - `language: string` // Set language

## Examples

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

## Future improvements

- Better error logging
- Highlights download
