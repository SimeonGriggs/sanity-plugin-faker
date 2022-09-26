# sanity-plugin-faker

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
