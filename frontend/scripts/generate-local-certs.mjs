import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certDir = path.resolve(__dirname, '..', 'certs')
const certPath = path.join(certDir, 'localhost.pem')
const keyPath = path.join(certDir, 'localhost-key.pem')

function mkcertInstallHint() {
  const platform = process.platform

  if (platform === 'win32') {
    return [
      'Install mkcert on Windows with one of:',
      '  winget install FiloSottile.mkcert',
      '  choco install mkcert',
      '  scoop install mkcert',
    ].join('\n')
  }

  if (platform === 'darwin') {
    return 'Install mkcert with: brew install mkcert'
  }

  return [
    'Install mkcert for your Linux distribution.',
    'See: https://github.com/FiloSottile/mkcert#installation',
  ].join('\n')
}

function commandExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(checker, [command], { stdio: 'ignore' })
  return result.status === 0
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (!commandExists('mkcert')) {
  console.error('mkcert is required but was not found in PATH.\n')
  console.error(mkcertInstallHint())
  process.exit(1)
}

fs.mkdirSync(certDir, { recursive: true })

const installResult = spawnSync('mkcert', ['-install'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
})

if (installResult.status !== 0) {
  console.warn(
    'Note: mkcert -install needs administrator rights for a trusted padlock.',
  )
  console.warn('Certificates will still work, but the browser may show a warning.')
}

run('mkcert', [
  '-cert-file',
  certPath,
  '-key-file',
  keyPath,
  'localhost',
  '127.0.0.1',
  '::1',
])

console.log(`Local certificates generated in ${certDir}`)
