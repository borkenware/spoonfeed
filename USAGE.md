# Using Spoonfeed
## Writing markdown
Spoonfeed uses a markdown superset to give more possibility to documentation writers. This superset has been designed
to be easy to read for people reading the plain markdown files, while giving more possibilities.

We use a completely custom parser, so it may or may not comply with the Markdown standard at 100%. We strongly
recommend following all the best practices to avoid parsing issues (and it'll even be beneficial for you!).

### Underline
Our markdown superset supports underlining using a "semi-standard" syntax used in a lot of existing superset:
`__Underlined content__`.

### Document Linking
To make references between documents, you can simply use a link tag, where the link is in the following format:
```
Uncategorized document:
##document-file-name

Categorized document:
##category-slug/document-file-name

Final link:
[Look this document](##important/information)

With an anchor:
[Look this document](##important/information#legal)
```

The document file name must not include the sorting prefix (`<int>-`), and the link will not be parsed if the document
doesn't exist. Spoonfeed will issue a warning in that case.

### Alert Boxes
Alert boxes are blocks of text that'll be emphasized, to give the user either an important information or to warn
them about something.

They are achieved by using a block quote which has on its first line either `info`, `warn` or `danger`.
```
>info
> This is an informative alert box
```

### Videos
Spoonfeed lets you import videos, either using plain media files, or YouTube videos. This can be useful to showcase
something depending on what you're documenting.

```
!!v[https://www.youtube.com/watch?v=Tt7bzxurJ1I]
!!v[/videos/test.mp4]
```

### H6 Headings
Spoonfeed uses H6 headings as table and code blocks headers rather than the unused h6 block. We strongly recommend
labelling all your tables & code blocks with them.

### HTTP Routes
Spoonfeed has support to highlight HTTP routes, which will be really useful if you are documenting a REST API.
HTTP routes should be prefixed with `%%`, then followed by their method in all uppercase, and then the path (which
should by convention exclude base path for readability). Route parameters must be wrapped in curly brackets.

```
%% POST /test/path/{parameter}/yes
```

### Codeblocks
Spoonfeed runs syntax highlighting using [shiki](https://shiki.matsu.io/) to give some color:tm: to your code.
It also shows line numbers for easier readability and referencing (Who wants to count lines to understand what that
person meant by "look line 69"?).

### Local resources
When embedding let's say images, it's rare to have them already hosted and you most likely have them next to
your documents. When embedding a resource, if Spoonfeed detects it's a resource on the filesystem, it'll import
it, optimize the resource and save it to the build folder.

Spoonfeed considers (by default, this is configurable) that all the assets will be in `<workdir>/assets`. For example,
let's take the following image declaration:
```md
![My Beautiful Cat](/photos/cat.jpg)
```
Spoonfeed will try to import the file `<workdir>/assets/photos/cat.jpg`, and do all the required magic in background.
If the file is not found, an error will be thrown.

## Building the Web interface
Spoonfeed outputs a bundled [Preact](https://preactjs.com) application, and uses [Rollup](http://rollupjs.org)
internally for bundling.

### Configuration
Since there is a lot you can configure, this is documented in a separate document. See CONFIGURING.md for more details
on how to configure Spoonfeed.

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
The outputs will be in the `build` directory (unless overridden in the config). Once that's done, you have 2 methods
of putting your docs online, depending on how you configured Spoonfeed:

#### Without server-side pre-rendering
You simply need to serve all the contents of the build folder. Just set your web server document root to that
and fire it up. We recommend setting a really high cache lifetime for everything served from `/dist/`.

#### With server-side pre-rendering
If you enabled server-side pre-rendering, then Spoonfeed did output a functional Node application in the
`build` folder. The node application is ready for production usage and contains the necessary security features
for such use.

First, you need to install dependencies by running `pnpm i` (or the install command of your preferred package
manager) in the build folder.

Then, you can fire up the server simply by running `node server.js`. By default, it'll listen to `0.0.0.0:80` (or
`0.0.0.0:443` if SSL is enabled), but this can be changed using the following environment vars:
 - `SPOONFEED_BIND_ADDR`: Controls the interface Spoonfeed listens to.
 - `SPOONFEED_BIND_PORT`: Controls the port Spoonfeed listens to.

If HTTPS upgrades are enabled, a plain HTTP server will be listen to `<SPOONFEED_BIND_ADDR>:80` and redirect incoming
requests to the HTTPS server. This cannot be changed.
