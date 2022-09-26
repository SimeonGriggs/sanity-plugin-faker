import React, {SyntheticEvent} from 'react'
import {useClient, useSchema} from 'sanity'
import {
  Stack,
  Button,
  Card,
  Flex,
  Checkbox,
  Text,
  Code,
  TextInput,
  useToast,
  Grid,
} from '@sanity/ui'
import _ from 'lodash'
import {faker} from '@faker-js/faker'
import {CheckmarkCircleIcon, CircleIcon, DocumentsIcon} from '@sanity/icons'

type Manifest = {
  [key: string]: {
    count: number
    fields: {
      [key: string]: any
    }
  }
}
export default function Faker() {
  const client = useClient()
  const toast = useToast()
  const schema = useSchema()

  const documentTypes = React.useMemo(() => {
    const schemaTypes = schema?._original?.types ?? []
    return schemaTypes.filter(({type, name}) => type === 'document' && !name.startsWith('sanity.'))
  }, [schema?._original?.types])
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(
    documentTypes.map((type) => type.name)
  )
  const [manifest, setManifest] = React.useState<Manifest>({})
  const [deleteExisting, setDeleteExisting] = React.useState<Boolean>(false)
  const [faking, setFaking] = React.useState<Boolean>(false)

  const handleSelectType = React.useCallback((e: SyntheticEvent<HTMLButtonElement>) => {
    const {value} = e.currentTarget
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }, [])

  const handleUpdateCount = React.useCallback(
    (e: SyntheticEvent<HTMLInputElement>) => {
      const {name, value} = e.currentTarget
      const path = [name, `count`]

      const newManifest = value
        ? _.set(manifest, path, parseInt(value, 10))
        : _.omit(manifest, path)

      setManifest({...newManifest})
    },
    [manifest]
  )

  const handleCheckbox = React.useCallback(
    (e: SyntheticEvent<HTMLInputElement>) => {
      const {name, value} = e.currentTarget
      const [typeName, ...rest] = name.split(',')
      const path = [typeName, 'fields', ...rest]

      // Toggle-off the whole object if this is a checkbox
      const toggleCurrent =
        [...name.split(',')].pop() === 'type' && _.get(manifest, path, undefined)
      const newManifest = toggleCurrent ? _.omit(manifest, path) : _.set(manifest, path, value)

      return setManifest({...newManifest})
    },
    [manifest]
  )

  const handleGenerate = React.useCallback(async () => {
    const transaction = client.transaction()
    setFaking(true)

    Object.keys(manifest).forEach((type) => {
      for (let index = 0; index < manifest[type].count; index++) {
        let doc = {_type: type}

        Object.keys(manifest[type].fields).forEach((field) => {
          switch (manifest[type].fields[field].type) {
            case 'string':
              doc = _.set(doc, field, faker.commerce.productName())
              break
            case 'slug':
              doc = _.set(
                doc,
                [field, 'current'],
                faker.commerce.productName().toLowerCase().replace(' ', '-')
              )
              break
            case 'number':
              doc = _.set(
                doc,
                field,
                parseInt(
                  faker.commerce.price(
                    manifest[type].fields[field]?.min,
                    manifest[type].fields[field]?.max,
                    0
                  ),
                  10
                )
              )
              break
            default:
              break
          }
        })

        transaction.create(doc)
      }
    })

    if (deleteExisting) {
      await client.delete({query: `*[_type in $types]`, params: {types: Object.keys(manifest)}})
    }

    transaction
      .commit()
      .then((res) => {
        toast.push({
          status: 'success',
          title: 'Success',
          description: `Created ${res.results.length} documents`,
        })
        setFaking(false)
        setManifest({})
      })
      .catch((err) => {
        console.error(err)

        toast.push({
          status: 'error',
          title: 'Error',
          description: err.message,
        })
        setFaking(false)
      })
  }, [deleteExisting, client, manifest, toast])

  const generateCount = React.useMemo(
    () => Object.keys(manifest).reduce((acc, type) => manifest?.[type]?.count + acc, 0),
    [manifest]
  )

  console.log(documentTypes)

  return (
    <Grid gap={4} columns={2} padding={4}>
      <Stack space={2}>
        <Flex gap={2}>
          {documentTypes.map((type) => (
            <Button
              tone="primary"
              mode={selectedTypes.includes(type.name) ? `default` : `ghost`}
              key={type.name}
              text={type?.title ?? type.name}
              icon={type.icon}
              onClick={handleSelectType}
              value={type.name}
              fontSize={1}
              padding={2}
            />
          ))}

          <Flex justify="flex-end" align="center" flex={1} gap={2}>
            <Button
              text="Delete Existing"
              tone="critical"
              icon={deleteExisting ? CheckmarkCircleIcon : CircleIcon}
              mode={deleteExisting ? `default` : `ghost`}
              onClick={() => setDeleteExisting(!deleteExisting)}
              disabled={Boolean(faking || Object.keys(manifest).length < 1)}
              fontSize={1}
              padding={2}
            />
            <Button
              text="Fake it!"
              icon={DocumentsIcon}
              tone="positive"
              onClick={handleGenerate}
              disabled={Boolean(faking || generateCount < 1)}
              fontSize={1}
              padding={2}
            />
          </Flex>
        </Flex>

        {documentTypes
          .filter((type) => selectedTypes.includes(type.name))
          .map((type) => (
            <Card key={type.name} padding={4} tone="primary" border radius={2}>
              <Stack space={3}>
                <Text weight="medium">{type?.title ?? type.name}</Text>
                <TextInput
                  name={type.name}
                  onChange={handleUpdateCount}
                  placeholder="Count of new documents to create"
                />
                <Text muted size={1}>
                  Fields:
                </Text>
                <Stack space={2}>
                  {type.fields.length > 0
                    ? type.fields.map((field) => (
                        <Flex key={field.name} align="center" gap={2}>
                          <Checkbox
                            name={`${type.name},${field.name},type`}
                            onChange={handleCheckbox}
                            checked={manifest?.[type.name]?.fields?.[field.name]}
                            value={field.type}
                          />
                          <Text>{field?.title ?? field.name}</Text>
                          <Code size={1}>{field.type}</Code>
                          {field.type === `number` &&
                          manifest?.[type.name]?.fields?.[field.name] ? (
                            <>
                              <TextInput
                                name={`${type.name},${field.name},min`}
                                onChange={handleCheckbox}
                                placeholder="Min"
                              />
                              <TextInput
                                name={`${type.name},${field.name},max`}
                                onChange={handleCheckbox}
                                placeholder="Max"
                              />
                            </>
                          ) : null}
                        </Flex>
                      ))
                    : null}
                </Stack>
              </Stack>
            </Card>
          ))}
      </Stack>
      <Card padding={4} tone="caution" border radius={2}>
        <pre>{JSON.stringify(manifest, null, 2)}</pre>
      </Card>
    </Grid>
  )
}
