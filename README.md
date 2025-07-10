# CodenamesVueJS

This is my attempt at creating a website for board game named [Codenames](https://en.wikipedia.org/wiki/Codenames_(board_game)) with an ability to include other board games to this website in a future modularly.

> [!WARNING]
> This is my first big pet project, so it definitely contains a lot of serious problems I'm not aware of right now, but I still tried to make it as good as I could at all before releasing it to the public repository.
## Tech Stack

**Client:** 
- Vue.js 3
- pinia
- vue-i18n
- vue-router
- TailwindCSS
- socket.io-client

**Server:**
- Node.js
- express
- socket.io
- cors
- chokidar (for detecting updated or new word packs)
- mongoose
- redis
- zod
- rate-limiter-flexible
- async-mutex
- bull

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Project Setup

For client side:
```sh
cd client
npm install
```

For server side:
```sh
cd server
npm install
```

After this, you should configure your `/client/public/config.json` and `/server/.env` files.

Inside `/client/public/config.json` file you should add your Codenames server URL as the value of the `codenamesURLs.codenames` field. The URL must end with `/codenames/`. You can find additional information in the FAQ.

What you should put inside `/server/.env` described inside `/server/.env.example` file.

### Compile and Hot-Reload for Development

For client side:
```sh
cd client
npm run dev
```

For server side:
```sh
cd client
node server.cjs
```


### Compile and Minify for Production

For client side:
```sh
cd client
npm run build
```

For server side:
```sh
cd client
node server.cjs
```
## Features

Unique features for this version of game:
- From 2 to 4 teams in one room
- Any time, word amount and guesses restrictions
- Multiple word packs available
- In-game text chat

At client side:
- Light/dark mode toggle
- Language selector
- The game rules tab is interactive

At server side:
- Ability to update or add new word packs without the need to restart the server
- Both long-term (using MongoDB) and short-term (caching using Redis) storage
## FAQ


#### What other fields I can configure inside config.json on client-side?

There are multiple other fields that you can configure:

```json
"websiteTitle" : "Title of your website",
"defaultLocale" : "Default locale of your website",
"fallbackLocale" : "Fallback locale of your website",
"defaultTheme" : "Default theme of your website",
"availableGames" : ["codenames", "Maybe other games"]
```

Fields `"defaultLocale"` and `"fallbackLocale"` should contain a valid language code that you have setted up inside i18n. Find more information here.

`"defaultTheme"` field's value can be only `"light"` or `"dark"`.

Field `"availableGames"` should contain a list of game unique IDs that you use to define which exactly game the user is wanna play. Find more information here.

Note that the `“defaultGameRules”` field is not included here. The reason is that this field is used to simplify the retrieval of predefined restrictions on the client side (which are still checked on the server side) and it is not recommended to change it. However, if you do want to change something, look also at the zod schemas, MongoDB schemas and constants inside constants.js file (all on the server side) for Codenames.

#### How can I add my own locale?

Everything that you need to set up contained inside `/client/src/i18n/` folder.

Add your locale's `.json` file to the `/client/src/i18n/locales/` folder and make a translation similar to what you can find in other translations files.

After that, go to the `/client/src/i18n/index.js` file and add your new locale with the appropriate code.

#### How can I add my own word pack?

You need to create a `.txt` file with a word (or what you think is one word) written on each line, put it inside `/server/WordPacks/Codenames/Packs/` folder and configure it inside `/server/WordPacks/Codenames/packs.json` file as follows:

```json
"your_word_pack_unique_id" : {
  "name" : "Name of your word pack",
  "language" : "The language of your word pack (e.g. english, if there is more than one, just separate them with commas)",
  "description" : "Description of your word pack",
  "version" : "Version of your word pack (i.e. 1.0.0)",
  "type" : "Your word pack type",
  "file_name" : "Name of your word pack file (i.e. english.txt)"
}
```

Each field is mandatory. 

Currently, only `"type": "text"` is supported, but there may be an update in a future that will add support for emoji and picture word pack types.

`"file_name"` field value should be the same as the name of the `.txt` file that you've placed inside `/server/WordPacks/Codenames/Packs/` folder (including the `.txt` part).

#### How can I update a word pack?

You should paste an updated file to the `/WordPacks/Codenames/Packs/` folder, but this won't trigger the update.

The actual trigger for update is a word pack version that you've defined inside `/WordPacks/Codenames/packs.json` file. Just update the `"version"` field value and your word pack will be updated.


## Roadmap

- [ ] More word pack types support

- [x] Add more integrations


## Authors

- [@amiadesu](https://www.github.com/amiadesu)

