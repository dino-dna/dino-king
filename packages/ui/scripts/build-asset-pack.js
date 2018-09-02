const constants = require('./constants')
const fs = require('fs')
const klaw = require('klaw-sync')

const readPack = () =>
  JSON.parse(fs.readFileSync(constants.ASSET_PACK_FILENAME))
const writePack = pack =>
  fs.writeFileSync(constants.ASSET_PACK_FILENAME, JSON.stringify(pack, null, 2))

const assets = klaw(constants.ASSETS_DIRNAME)

const imageAssets = assets
  .map(asset => asset.path)
  .filter(filename => filename.indexOf('__') === -1)
  .filter(filename => filename.match(/\.png$/))
  .map(filename => filename.replace(/^.*assets/, 'assets'))

const audioAssets = assets
  .map(asset => asset.path)
  .filter(filename => filename.indexOf('__') === -1)
  .filter(filename => filename.match(/\.ogg$/))
  .map(filename => filename.replace(/^.*assets/, 'assets'))

const pack = readPack()

// purge images, audio, and replace with discovered assets
pack.preload.files = pack.preload.files.filter(
  file => !file.type.match(/(image|audio)/)
)
pack.preload.files = pack.preload.files.concat(
  imageAssets.map(asset => ({
    type: 'image',
    key: asset.replace(/assets\/images\//, '').replace(/\..*$/, ''),
    url: asset
  }))
)
pack.preload.files = pack.preload.files.concat(
  audioAssets.map(asset => ({
    type: 'audio',
    key: asset.replace(/assets\/tracks\//, '').replace(/\..*$/, ''),
    url: asset
  }))
)

// always write the map for simplicity
pack.preload.files.push({
  type: 'image',
  key: 'tileset',
  url: 'tileset.png'
})

writePack(pack)
