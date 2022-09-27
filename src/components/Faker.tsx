import React, {SyntheticEvent} from 'react'
import {SanityDocumentLike, useClient, useSchema} from 'sanity'
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
  Box,
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
      const newManifest = {...manifest}
      const {name, value} = e.currentTarget
      const [typeName, ...rest] = name.split(',')
      const path = [typeName, 'fields', ...rest]

      // Toggle-off the whole object if this is a checkbox
      const toggleCurrent =
        [...name.split(',')].pop() === 'type' && _.get(newManifest, path, undefined)
      if (toggleCurrent) {
        _.unset(newManifest, path.slice(0, -1))

        // Remove any now-empty types
        Object.keys(newManifest).forEach((type) => {
          // Empty `fields` key
          if (!Object.keys(newManifest[type].fields).length) {
            _.unset(newManifest, [type, `fields`])
          }

          // Empty type
          if (!Object.keys(newManifest[type]).length) {
            _.unset(newManifest, [type])
          }
        })
      } else {
        _.set(newManifest, path, value)
      }

      return setManifest(newManifest)
    },
    [manifest]
  )

  const handleGenerate = React.useCallback(async () => {
    const data: {[key: string]: SanityDocumentLike[]} = {}
    setFaking(true)

    // Create fake data stubs first, in case we need to create references
    Object.keys(manifest).forEach((type) => {
      data[type] = []

      for (let index = 0; index < manifest[type].count; index++) {
        data[type].push({_id: faker.datatype.uuid(), _type: type})
      }
    })

    // Now fill those documents with fake data
    Object.keys(manifest).forEach((type) => {
      for (let index = 0; index < manifest[type].count; index++) {
        let doc = data[type][index]

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
                    manifest[type].fields[field]?.min ?? undefined,
                    manifest[type].fields[field]?.max ?? undefined,
                    0
                  ),
                  10
                )
              )
              break
            case 'reference':
              {
                // Get random document of the referenced type
                const referenceTypes: string[] = Object.keys(manifest[type].fields[field]?.to)

                // Pick a random type
                const targetType = _.sample(referenceTypes)

                // Pick a random document of that type
                const targetDoc = targetType ? _.sample(data[targetType]) : null

                if (targetDoc) {
                  doc = _.set(doc, field, {
                    _type: 'reference',
                    _ref: targetDoc._id,
                  })
                }
              }
              break
            default:
              break
          }
        })

        data[type][index] = doc
      }
    })

    // Delete existing documents
    if (deleteExisting) {
      await client.delete({query: `*[_type in $types]`, params: {types: Object.keys(manifest)}})
    }

    const transaction = client.transaction()
    Object.keys(data).forEach((type) => data[type].forEach((doc) => transaction.create(doc)))

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
                <Flex align="center" gap={2}>
                  <Text>Create</Text>
                  <TextInput
                    style={{width: 100}}
                    name={type.name}
                    onChange={handleUpdateCount}
                    placeholder="Count"
                  />
                  <Box flex={1}>
                    <Text weight="medium">{type?.title ?? type.name} Document(s)</Text>
                  </Box>
                </Flex>

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
                          {field.type === `reference` &&
                          manifest?.[type.name]?.fields?.[field.name] ? (
                            <Flex align="center" gap={2}>
                              {field.to.map((refTo: {type: string}) => (
                                <>
                                  <Checkbox
                                    key={refTo.type}
                                    onChange={handleCheckbox}
                                    checked={
                                      manifest?.[type.name]?.fields?.[field.name]?.to?.[refTo.type]
                                    }
                                    name={`${type.name},${field.name},to,${refTo.type}`}
                                  />
                                  <Text>{refTo.type}</Text>
                                </>
                              ))}
                            </Flex>
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
