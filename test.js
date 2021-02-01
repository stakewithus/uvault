const child_process = require("child_process")
const util = require("util")

const exec = util.promisify(child_process.exec)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log(`Running mainnet tests...`)

  // this will be expaned to list of files
  // test/mainnet/**/test-*.ts
  const files = process.argv.slice(2)

  for (const file of files) {
    console.log(file)

    // test //
    // NOTE: test failures are printed to stdout, exit code = 0
    const { stdout } = await exec(`npx truffle --network mainnet_fork test  ${file}`)
    console.log(stdout)

    // sleep
    console.log(`sleeping 60 secs...`)
    await sleep(60 * 1000)
  }
}

main()
