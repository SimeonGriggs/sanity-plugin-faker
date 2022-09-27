# sanity-plugin-faker

Generate massive amounts of fake structured content.

This plugin is a Studio v3 Exclusive proof-of-concept to look at your Studio's schema and use [Faker](https://fakerjs.dev/) to generate strings, numbers, array items and images.

It has its limitations. It is destructive. **It will delete all documents of the type it is about to create** if "Delete Existing" is selected. It is not recommended or officially supported.

## Installation

```
npm install --save sanity-plugin-faker
```

or

```
yarn add sanity-plugin-faker
```

## Usage

Add it as a plugin in sanity.config.ts (or .js):

```ts
import {createConfig} from 'sanity'
import {faker} from 'sanity-plugin-faker'

export const createConfig({
  //...
  plugins: [
    faker()
  ]
})
```

## License

MIT © Simeon Griggs
See LICENSE
