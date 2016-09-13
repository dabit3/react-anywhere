# React Anywhere

An opinionated environment for building cross-platform react apps with no configuration. Inspired by and largely forked from create-react-app.

### Getting Started

```
# Install
npm i -g react-anywhere

# Create Your App
react-anywhere init MyApp
cd MyApp

# Edit ./MyApp.js

# Develop for browsers:
react-anywhere web

# Develop on Android:
react-anywhere android

# Develop on iOS:
react-anywhere ios

# Launch react-native packager, for use when native apps are already installed:
react-anywhere native
```


### Reserved files and warmup

You will notice that `react-anywhere` needs to put a few extra files and directories into your project before it can run your app.

__DO NOT EDIT THESE RESERVED FILES!!__ They are considered an implementation detail of the environment and aren't really part of your app, so react-anywhere will regularly wipe them out and replace them.

This warmup step can be run independently, and will force a refresh of the reserved files:

```
react-anywhere init MyApp
cd MyApp
ls
> MyApp.js       node_modules    package.json
react-anywhere warmup
ls
> android           index.android.js    index.ios.js        ios         package.json
> MyApp.js         index.html      index.js        node_modules        web
```

The files are excluded from git with the default `.gitignore` file, and will be cleaned up as part of the npm `prepublish` hook. You can also clean up by hand:

```
# Run this to clean up the junk that react-anywhere puts in your project root:
react-anywhere clean
ls
> MyApp.js       node_modules    package.json

```


### Anywhere version is defined by your project

In the `package.json` of your project, you can specify which version of the environment should be used to run your app.

```
{
  "name": "MyApp",
  "version": "0.0.0",
  "reactAnywhere": {
    "version": "0.1.0"
  }
}
```

When running `react-anywhere` inside of `MyApp`, this specified version gets used. To upgrade to future versions of the `react-anywhere` environment, bump this version in your `package.json` and re-run any `react-anywhere` command.

### Using another version of Anywhere

You can *always* override the version of `react-anywhere` that gets used to run a command:

```
react-anywhere init MyApp --react-anywhere-version=0.1.0
```

This is useful to create an app with a different environment, but it can also be used inside existing apps to experiment with future versions of `react-anywhere` without commiting to it.


## Roadmap & Contributions

We have lots of work to do! Here is what I would like to have supported:

- Automate Jest testing
- Automate NPM publishing
- Automate native builds for play store and app store
- Allow package.json configuration of app icon and favicon
- Support "eject" ala create-react-app
- Support more platforms
- Support native dependencies
- Server rendering
- Make web server more extensible
- Switch over to [react-primitives](https://github.com/lelandrichardson/react-primitives) instead of relying on react-native primitives with react-native-web shim

Any and all contributions are welcome! Before embarking on a big feature, please post an RFC issue to discuss the planned implementation.
