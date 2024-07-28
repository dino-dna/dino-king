var path = require("path");

const UI_DIRNAME = path.resolve(__dirname, "..");
const UI_SRC_DIRNAME = path.resolve(UI_DIRNAME, "src");
const ASSEST_TS_METADATA_FILENAME = path.resolve(UI_SRC_DIRNAME, "assets.ts");
const ASSET_PACK_FILENAME = path.resolve(UI_DIRNAME, "public/pack.json");
const ASSETS_DIRNAME = path.resolve(UI_DIRNAME, "assets");

module.exports = {
  ASSETS_DIRNAME,
  ASSEST_TS_METADATA_FILENAME,
  ASSET_PACK_FILENAME,
  UI_DIRNAME,
};
