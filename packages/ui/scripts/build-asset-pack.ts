import { UI_DIRNAME, ASSETS_DIRNAME } from './constants'
import { CharacterSprite } from '../src/interfaces'
import fs from 'fs-extra'
import path from 'path'

const SPRITE_CHARACTER_KEYS = ['king', 'peon', 'knight']
const CHARACTER_BUILD_TARGET = path.resolve(UI_DIRNAME, 'public/characters')
const log = (...args: any[]) => console.log('[build-asset-pack]', ...args)

async function build () {
  await clean()
  log('compiling character assets from <sprite-tool> into public dir in phaser format')
  for (const characterKey of SPRITE_CHARACTER_KEYS) await buildCharacter(characterKey)
}

async function buildCharacter (characterName: string) {
  const characterSpriteSheet = path.resolve(ASSETS_DIRNAME, `${characterName}.png`)
  const characterSpriteJson = path.resolve(ASSETS_DIRNAME, `${characterName}.json`)
  if (!fs.existsSync(characterSpriteJson) || !fs.existsSync(characterSpriteSheet)) {
    throw new Error('cannot find character datas')
  }
  log(`copying ${characterName} assets`)
  const characterSpriteJsonTargetFilename = path.resolve(CHARACTER_BUILD_TARGET, `${characterName}.json`)
  await fs.copyFile(characterSpriteSheet, path.resolve(CHARACTER_BUILD_TARGET, `${characterName}.png`))
  await fs.copyFile(characterSpriteJson, characterSpriteJsonTargetFilename)
  log(`reformatting ${characterName} animation titles`)
  const characterSpriteJsonParsed: CharacterSprite = require(characterSpriteJsonTargetFilename)
  characterSpriteJsonParsed.textures.forEach(texture => {
    texture.size
    texture.frames.forEach(frame => {
      frame.filename = frame.filename.replace('.png', '')
    })
  })
  log(`writing ${characterSpriteJsonTargetFilename}`)
  await fs.writeFile(characterSpriteJsonTargetFilename, JSON.stringify(characterSpriteJsonParsed, null, 2))
}

async function clean () {
  await fs.remove(CHARACTER_BUILD_TARGET)
  await fs.mkdir(CHARACTER_BUILD_TARGET)
}

// go
build()
