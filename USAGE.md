# Using SpoonFeed

## Writing markdown
SpoonFeed uses a markdown superset to give more possibility to documentation writers. This superset has been designed
to be easy to read for people reading the markdown files and to not be ugly.

### Document Linking
TBD

### Alert Boxes
Alert boxes are blocks of text that'll be emphasized, to give the user either an important information or to warn
them about something.

They are achieved by using a block quote which has on its first line either `info`, `warn` or `danger`.
```
>info
> This is an informative alert box
```

### H6 Headings
SpoonFeed uses H6 headings as table and code blocks headers rather than the unused h6 block. We strongly recommend
labelling all your tables & code blocks with them.

### HTTP Routes
SpoonFeed has support to highlight HTTP routes, which will be really useful if you are documenting a REST API.
HTTP routes should be prefixed with `%%`, then followed by their method in all uppercase, and then the path (which
should by convention exclude base path for readability). Route parameters must be wrapped in curly brackets.

```
%% POST /test/path/{parameter}/yes
```

## Building the Web interface
SpoonFeed outputs a bundled [Preact](https://preactjs.com) application, and uses [Rollup](http://rollupjs.org)
internally for bundling.

### Configuration
Since there is a lot you can configure, this is documented in a separate document. See CONFIGURING.md for more details
on how to configure SpoonFeed.

### Development
During development you'll be able to see live changes you do to the documentation to have visual feedback about
what you're doing. You can also see live changes to the configuration to some extent. Some configuration changes
do require a complete restart.

```
spoonfeed serve
```

### Bundling
To bundle the Preact app and get ready to deploy it, make sure your configuration is ready and run
```
spoonfeed bundle
```

The outputs will be in the `build` directory (unless overridden in the config) and will contain at least:
 - A `dist` folder with all the bundled assets
 - An `index.html` file that should be served to clients

### Server-side pre-rendering
You can also make SpoonFeed output a small node server to have server-side pre-rendering. This means when accessing
your documentation pages, people will receive a fully-rendered webpage. This will help making the webpage to show
faster on users with slower computers or networks, but will also help enhance your SEO score.

The generated node server has no dependency and only runs uses standard NodeJS lib, so you can just start it as soon
as it's generated without having to worry about dependencies. The server should be safe to expose to the public even
without a reverse proxy, as we add important security headers and let you configure SSL for HTTPS support.

Once the app has been bundled, you can simply start the server by doing `node build/index.js`.
