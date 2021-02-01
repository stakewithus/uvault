const glob = require("glob")
const child_process = require("child_process")
const util = require("util")

const exec = util.promisify(child_process.exec)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function _glob(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, null, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

async function main() {
  console.log("Running mainnet tests...")

  const files = await _glob("test/unit/**/test-*.ts")

  for (const file of files) {
    console.log(file)

    // test
    const { stdout } = await exec(`npx truffle --network mainnet_fork test  ${file}`)
    console.log(stdout)

    // sleep
    console.log(`sleeping 60 secs...`)
    await sleep(60 * 1000)
  }
}

main()
