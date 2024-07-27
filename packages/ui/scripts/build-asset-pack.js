const constants = require("./constants");
const fs = require("fs-extra");
const path = require("path");

const characterKeys = ["king", "peon", "knight"];

const CHARACTER_BUILD_TARGET = path.resolve(
  constants.UI_DIRNAME,
  "public/characters",
);

// clean
fs.removeSync(CHARACTER_BUILD_TARGET);
fs.mkdirSync(CHARACTER_BUILD_TARGET);

characterKeys.forEach((characterName) => {
  const characterSpriteSheet = path.resolve(
    constants.ASSETS_DIRNAME,
    `${characterName}.png`,
  );
  const characterSpriteJson = path.resolve(
    constants.ASSETS_DIRNAME,
    `${characterName}.json`,
  );
  if (
    !fs.existsSync(characterSpriteJson) ||
    !fs.existsSync(characterSpriteSheet)
  ) {
    throw new Error("cannot find character datas");
  }
  console.log(`copying ${characterName} assets`);
  const characterSpriteJsonTargetFilename = path.resolve(
    CHARACTER_BUILD_TARGET,
    `${characterName}.json`,
  );
  fs.copyFileSync(
    characterSpriteSheet,
    path.resolve(CHARACTER_BUILD_TARGET, `${characterName}.png`),
  );
  fs.copyFileSync(characterSpriteJson, characterSpriteJsonTargetFilename);
  console.log(`reformatting ${characterName} animation titles`);
  const characterSpriteJsonParsed = require(characterSpriteJsonTargetFilename);
  characterSpriteJsonParsed.textures.forEach((texture) => {
    texture.frames.forEach((frame) => {
      frame.filename = frame.filename.replace(".png", "");
    });
  });
  fs.writeFileSync(
    characterSpriteJsonTargetFilename,
    JSON.stringify(characterSpriteJsonParsed, null, 2),
  );
});
// const readPack = () =>
//   JSON.parse(fs.readFileSync(constants.ASSET_PACK_FILENAME))
// const writePack = pack =>
//   fs.writeFileSync(constants.ASSET_PACK_FILENAME, JSON.stringify(pack, null, 2))

// const pack = readPack()

// purge images, audio, and replace with discovered assets
// pack.preload.files = pack.preload.files.filter(
//   file => !file.type.match(/(image|audio)/)
// )
// pack.preload.files = pack.preload.files.concat(
//   imageAssets.map(asset => ({
//     type: 'image',
//     key: asset.replace(/assets\/images\//, '').replace(/\..*$/, ''),
//     url: asset
//   }))
// )
// pack.preload.files = pack.preload.files.concat(
//   audioAssets.map(asset => ({
//     type: 'audio',
//     key: asset.replace(/assets\/tracks\//, '').replace(/\..*$/, ''),
//     url: asset
//   }))
// )

// // always write the map for simplicity
// pack.preload.files.push({
//   type: 'image',
//   key: 'tileset',
//   url: 'tileset.png'
// })

// writePack(pack)
