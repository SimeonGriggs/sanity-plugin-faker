import {DocumentsIcon} from '@sanity/icons'
import type {Tool} from 'sanity'

import Faker from './components/Faker'

export const fakerTool = (): Tool => ({
  name: 'faker',
  title: 'Faker',
  component: Faker,
  icon: DocumentsIcon,
})
