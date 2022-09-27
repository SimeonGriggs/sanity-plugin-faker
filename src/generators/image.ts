type ImageBlock = {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
}

export async function generateFakeImage({client}: {client: any}): Promise<ImageBlock> {
  const imageBlob = await fetch(`https://picsum.photos/1200/800`).then((res) => res.blob())
  const imageUpload = await client.assets.upload('image', imageBlob)

  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: imageUpload._id,
    },
  }
}
