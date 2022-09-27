import React from 'react'
import {Flex, Checkbox, Text, Code, TextInput, Stack} from '@sanity/ui'

type FieldProps = {
  manifest: any
  type: {[key: string]: any}
  field: {[key: string]: any}
  handleCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Field(props: FieldProps) {
  const {manifest, type, field, handleCheckbox} = props
  const checked = manifest?.[type.name]?.fields?.[field.name]

  if (field.type === 'array') {
    console.log(field)
  }

  return (
    <Stack space={2}>
      <Flex key={field.name} align="center" gap={2}>
        <Checkbox
          name={`${type.name},${field.name},type`}
          onChange={handleCheckbox}
          checked={checked}
          value={field.type}
        />
        <Text>{field?.title ?? field.name}</Text>
        <Code size={1}>{field.type}</Code>

        {field.type === `number` && checked ? (
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
        {field.type === `reference` && checked ? (
          <Flex align="center" gap={2}>
            {field.to.map((refTo: {type: string}) => (
              <>
                <Checkbox
                  key={refTo.type}
                  onChange={handleCheckbox}
                  checked={manifest?.[type.name]?.fields?.[field.name]?.to?.[refTo.type]}
                  name={`${type.name},${field.name},to,${refTo.type}`}
                />
                <Text>{refTo.type}</Text>
              </>
            ))}
          </Flex>
        ) : null}
      </Flex>
      {field.type === `array` && checked ? (
        <Stack space={2} paddingLeft={3}>
          {field.of.length > 0 ? (
            <Flex align="center" gap={2}>
              {field.of.map((innerField: any) => (
                <Field
                  key={innerField.type}
                  manifest={manifest}
                  type={type}
                  field={{name: innerField.type, ...innerField}}
                  handleCheckbox={handleCheckbox}
                />
              ))}
            </Flex>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  )
}
