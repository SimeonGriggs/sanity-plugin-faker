import {createPlugin} from 'sanity'

import {fakerTool} from './tool'

export const faker = createPlugin(() => {
  return {
    name: 'sanity-plugin-faker',
    tools: [fakerTool()],
  }
})
