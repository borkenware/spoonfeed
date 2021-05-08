# Spoonfeed
[![License](https://img.shields.io/github/license/borkenware/spoonfeed.svg?style=flat-square)](https://github.com/borkenware/spoonfeed/blob/mistress/LICENSE)

Generate beautiful documentation portals in seconds from easy-to-edit markdown files. Bundle your markdown files
into a Preact app easily distributable on the World Wide Web:tm:

# NOTE
This project is a heavy WIP and is not usable yet.

--------

## Installation
This package hasn't been published yet.
<!--
```zsh
# With npm:
npm i @borkenware/spoonfeed

# With yarn:
yarn add @borkenware/spoonfeed

# With pnpm:
pnpm i @borkenware/spoonfeed
```
-->

See USAGE.md for information about how to use this.

## Why?
Writing documentation is already a boring process, and the documentation team may not have time to put into
distributing it in an easy-to-access format.

Spoonfeed takes care of that for you or your team. Focus on writing crystal clear documentation, in an easy-to-edit
format, and let Spoonfeed take care of the rest.

Originally, a few Borkenware projects used their own rice of documentation generator which was a pain since they
all shared slight differences. We decided to unify all of our pieces in a unified tool that not only us can benefit
from.

## The advantages
Spoonfeed's design has been really influenced by how [Discord](https://discord.com) structured their API documentation.
However, we were not super convinced by the approach they have been taking to incorporate those markdown files in
their Developer Portal.

In their Developer Portal, Discord sends the raw markdown to the clients, and then their React application uses
Simple Markdown and HLJS to render the portal contents. While this is easy to implement, this means the client
has to download and run way more JS code than it should: according to Bundlephobia, HLJS is 93.6kB minified, and
Simple Markdown 14.9kB. Plus the weight of the markdown blob.

What Spoonfeed does is it parses the markdown files at compile time, and outputs a plain Preact component. This means
we no longer need libraries to parse our markdown at-runtime, reducing the load times and the processing power required
(which is a valuable resource for mobile devices).

## Why using Preact?
We love React at Borkenware, but it unfortunately often ends up in rather large bundles, which is not justified here
since we don't use a lot of React features. So we've decided to ship Preact, to have the best of the two worlds.

We will in the future also support generating plain html files, for compatibility with GitHub pages or if you prefer
it that way. They will most likely come with a reduced feature set, though.

## Why "Spoonfeed"?
GitHub suggested `fictional-spoon` when creating the repo. No it's not a joke it's actually how it got this name.
