const fs = require('fs-extra')
const { basename, resolve } = require('path')
const dirname = process.argv[2]

void (async function go () {
  const nodes = await fs.readdir(dirname)
  let imageNodes = nodes
    .filter(node => node.match(/\.png$/))
    .map(relative => resolve(dirname, relative))
  // 'Walk (6).png' ==> ['walk', 6]
  for (let imageNode of imageNodes) {
    let [_, action, frame] = basename(imageNode).match(/(^[a-zA-Z]+).+(\d+)/)
    const actionDirname = resolve(dirname, action.toLowerCase())
    await fs.mkdirp(actionDirname)
    await fs.move(imageNode, resolve(actionDirname, `${frame}.png`))
  }
})()
