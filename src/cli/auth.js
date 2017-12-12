import fs from 'fs'
import path from 'path'
import prompt from 'prompt'
import chalk from 'chalk'
import validUrl from 'valid-url'
import axios from 'axios'
import Confirm from 'prompt-confirm'

import util from '../util'

const AUTH_FILE = '.auth.json'

// TODO: this part replicates `start.js`, refactor
const getDataDir = () => {
  const projectPath = path.resolve('.')

  const botfile = path.join(projectPath, 'botfile.js')
  if (!fs.existsSync(botfile)) {
    util.print('error', `(fatal) No ${chalk.bold('botfile.js')} file found at: ` + botfile)
    process.exit(1)
  }

  // eslint-disable-next-line no-eval
  const bf = eval('require')(botfile)
  return util.getDataLocation(bf.dataDir, projectPath)
}

const getAuthFile = () => path.join(getDataDir(), AUTH_FILE)

const readAuth = () => {
  const authFile = getAuthFile()
  try {
    const json = fs.readFileSync(authFile, 'utf-8')
    return JSON.parse(json)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Error reading ${authFile}:`, err.message)
    }
  }
  return {}
}

const writeAuth = auth => {
  const authFile = getAuthFile()
  fs.writeFileSync(authFile, JSON.stringify(auth, null, 2))
}

exports.login = botUrl => {
  if (!validUrl.isUri(botUrl)) {
    console.error(`Doesn't look like valid URL: ${botUrl}`)
    return
  }

  botUrl = botUrl.replace(/\/+$/, '')

  const schema = {
    properties: {
      user: {
        description: chalk.white('User:'),
        required: true
      },
      password: {
        description: chalk.white('Password:'),
        hidden: true,
        required: true
      }
    }
  }

  prompt.message = ''
  prompt.delimiter = ''
  prompt.start()

  const url = botUrl + '/api/login'

  prompt.get(schema, (err, { user, password }) => {
    axios
      .post(url, { user, password })
      .then(result => {
        if (result.data.success) {
          const auth = readAuth()
          auth[botUrl] = result.data.token
          writeAuth(auth)
          console.log(`Logged in successfully. Auth token saved in ${AUTH_FILE}`)
        } else {
          throw new Error(result.data.reason)
        }
      })
      .catch(err => {
        console.error(err.message)
      })
  })
}

exports.logout = botUrl => {
  if (!botUrl) {
    new Confirm("You're about to delete all saved auth tokens in the current folder. Are you sure?")
      .run()
      .then(answer => {
        if (!answer) {
          return
        }
        writeAuth({})
      })

    return
  }

  botUrl = botUrl.replace(/\/+$/, '')
  const auth = readAuth()
  if (!auth[botUrl]) {
    console.warn(`No saved token for ${botUrl}, nothing to do.`)
    return
  }

  delete auth[botUrl]
  writeAuth(auth)
  console.log('Logged out successfully.')
}
