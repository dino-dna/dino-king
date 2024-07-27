import assert from 'assert'
import path from 'path'

export const projectRoot = path.resolve(__dirname, '..')
export const uiProjectRoot = path.resolve(projectRoot, '../ui')
export const uiMapFilename = path.resolve(uiProjectRoot, 'public', 'map.json')
export const serverMapFilename = path.resolve(projectRoot, 'src', 'resources', 'map.json')

// assert(require(uiMapFilename))
