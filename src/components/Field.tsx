import React from 'react'
import {Flex, Checkbox, Text, Code, TextInput, Stack} from '@sanity/ui'

type FieldProps = {
  manifest: any
  type: {[key: string]: any}
  field: {[key: string]: any}
  handleCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void
  parent?: string
}

export default function Field(props: FieldProps) {
  const {manifest, type, field, handleCheckbox, parent} = props
  const checked = manifest?.[type.name]?.fields?.[field.name]

  return (
    <Stack space={2}>
      <Flex key={field.name} align="center" gap={2}>
        <Checkbox
          name={parent ? `${type.name},${parent},types` : `${type.name},${field.name},type`}
          onChange={handleCheckbox}
          checked={checked}
          value={field.type}
        />
        <Text>
          {field?.title ?? field.name}
          {/* ({parent ? `Parent: ${parent}` : null}) */}
        </Text>
        <Code size={1}>{field.type}</Code>

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
      {(field.type === `array` || field.type === `number`) && checked ? (
        <>
          <Flex align="center" gap={2}>
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
            {field.type === `array` ? (
              <Stack space={2} paddingLeft={3}>
                {field.of.length > 0 ? (
                  <Flex align="center" gap={2}>
                    {field.of.map((innerField: any) => (
                      <Field
                        parent={field.name}
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
          </Flex>
        </>
      ) : null}
    </Stack>
  )
}
