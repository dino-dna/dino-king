/**
 * Generate asset packs used by phaser to load in frames for sprites.
 */
const constants = require("./constants");
const fs = require("fs-extra");
const path = require("path");
const { merge } = require("lodash");

const characterKeys = ["king", "peon", "knight"];

const CHARACTER_BUILD_TARGET = path.resolve(
  constants.UI_DIRNAME,
  "public/characters",
);

// clean
fs.removeSync(CHARACTER_BUILD_TARGET);
fs.mkdirSync(CHARACTER_BUILD_TARGET);

const characterDatas = characterKeys.map((characterName) => {
  const characterSpriteSheetFilename = path.resolve(
    constants.ASSETS_DIRNAME,
    `${characterName}.png`,
  );
  const characterSpriteJson = path.resolve(
    constants.ASSETS_DIRNAME,
    `${characterName}.json`,
  );
  if (
    !fs.existsSync(characterSpriteJson) ||
    !fs.existsSync(characterSpriteSheetFilename)
  ) {
    throw new Error("cannot find character datas");
  }

  console.log(`copying ${characterName} assets`);
  const characterSpriteJsonTargetFilename = path.resolve(
    CHARACTER_BUILD_TARGET,
    `${characterName}.json`,
  );
  fs.copyFileSync(
    characterSpriteSheetFilename,
    path.resolve(CHARACTER_BUILD_TARGET, `${characterName}.png`),
  );
  fs.copyFileSync(characterSpriteJson, characterSpriteJsonTargetFilename);


  console.log(`reformatting ${characterName} animation titles`);
  const characterSpriteJsonParsed = require(characterSpriteJsonTargetFilename);
  const filenamesByTextureName = new Map();
  characterSpriteJsonParsed.textures.forEach((texture) => {
    const textureName = texture.image;
    texture.frames.forEach((frame) => {
      frame.filename = frame.filename.replace(".png", "");

      const filenames = filenamesByTextureName.get(textureName) || [];
      filenames.push(frame.filename)
      filenamesByTextureName.set(textureName, filenames);
    });
    texture.frames.sort((a, b) => {
      return a.filename.localeCompare(b.filename);
    });
  });
  fs.writeFileSync(
    characterSpriteJsonTargetFilename,
    JSON.stringify(characterSpriteJsonParsed, null, 2),
  );


  const textureFrameIndicies = [...filenamesByTextureName.entries()].map(([textureName, filenames]) => {
    const frameStates = filenames.map(filename => {
      const [state, frameNumStr] = filename.split('/')
      const frameNum = Number(frameNumStr)
      return [state, frameNum]
    });
    const framesByState = frameStates.reduce((acc, [stateName, frameNum]) => {
      const state = acc[stateName] || { min: Infinity, max: -Infinity}
      state.min = Math.min(state.min, frameNum)
      state.max = Math.max(state.max, frameNum)
      acc[stateName] = state
      return acc
    }, {});;
    return { textureName, framesByState }
  }).reduce((acc, { textureName, framesByState }) => {
    acc[textureName.replace(/\..+/, '')] = framesByState
    return acc
  }, {});

  return { textureFrameIndicies };
});

fs.writeFileSync(
  constants.ASSEST_TS_METADATA_FILENAME,
  `export const assets = ${JSON.stringify(merge({}, ...characterDatas), null, 2)} as const`,
  'utf-8'
)
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
