var path = require('path')

const UI_DIRNAME = path.resolve(__dirname, '..')
const ASSETS_DIRNAME = path.resolve(UI_DIRNAME, 'public/assets')
const ASSET_PACK_FILENAME = path.resolve(UI_DIRNAME, 'public/pack.json')

module.exports = {
  ASSETS_DIRNAME,
  ASSET_PACK_FILENAME,
  UI_DIRNAME
}
