require('perish')
import fs from 'fs-extra'
import { uiMapFilename, serverMapFilename } from './common'

fs.copyFile(uiMapFilename, serverMapFilename)
