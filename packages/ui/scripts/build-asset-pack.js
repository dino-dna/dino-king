const constants = require('./constants')
const fs = require('fs')
const klaw = require('klaw-sync')

const readPack = () => JSON.parse(fs.readFileSync(constants.ASSET_PACK_FILENAME))
const writePack = pack => fs.writeFileSync(constants.ASSET_PACK_FILENAME, JSON.stringify(pack, null, 2))

const assets = klaw(constants.ASSETS_DIRNAME)

const imageAssets = assets
  .map(asset => asset.path)
  .filter(filename => filename.match(/\.png$/))
  .map(filename => filename.replace(/^.*assets/, 'assets'))

const pack = readPack()
// purge images, and replace with fs images
pack.preload.files = pack.preload.files.filter(file => !file.type.match(/image/))
pack.preload.files = pack.preload.files.concat(imageAssets.map(imageAsset => ({
  type: 'image',
  key: imageAsset.replace(/assets\/images\//, '').replace(/\..*$/, ''),
  url: imageAsset
})))

writePack(pack)
