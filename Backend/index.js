const express = require('express')
const app = express()
var cors = require('cors')
const axios = require('axios')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const dotenv = require('dotenv')
// var util = require('util')
const adapter = new FileSync('db.json')
const NanoClient = require('nano-node-rpc')
dotenv.config()
const ipfilter = require('express-ipfilter').IpFilter
const nanoClient = new NanoClient({ apiKey: process.env.NINJA_API_KEY })
const db = low(adapter)

const ips = ['::1']
// Create the server
app.use(ipfilter(ips, { mode: 'allow' }))
// Set some defaults (required if your JSON file is empty)
db.defaults({ signedUsers: [], users: [], tsxes: [], count: 0 })
  .write()
app.use(cors())
// console.log(process.argv);
app.get('/getAccessToken', function (req, res, next) {
  console.log('Came here')
  axios({
    // make a POST request
    method: 'post',
    // to the Github authentication API, with the client ID, client secret
    // and request token
    url: `https://github.com/login/oauth/access_token?client_id=${process.argv[2].trim()}&state=${req.query.state}&client_secret=${process.argv[3].trim()}&code=${req.query.code}`,
    // Set the content type header, so that we get the response in JSOn
    headers: {
      accept: 'application/json'
    }
  }).then((response) => {
    // Once we get the response, extract the access token from
    // the response body
    let accessToken = response.data.access_token
    console.log(accessToken)
    // redirect the user to the welcome page, along with the access token
    if (!accessToken) {
      res.send('ERR_CODE_ACCESS_TOKEN')
    } else {
      axios({
        // make a POST request
        method: 'get',
        // to the Github authentication API, with the client ID, client secret
        // and request token
        url: `https://api.github.com/user`,
        // Set the content type header, so that we get the response in JSOn
        headers: {
          Authorization: 'token ' + accessToken
        } }).then((meResult) => {
        axios({
          // make a POST request
          method: 'get',
          // to the Github authentication API, with the client ID, client secret
          // and request token
          url: `https://api.github.com/user/emails`,
          // Set the content type header, so that we get the response in JSOn
          headers: {
            Authorization: 'token ' + accessToken
          } }).then((mailR) => {
          // If found same node Id then only upate access token
          let oldData = db.get('users').find({ node_id: meResult.data.node_id }).value()
          // console.log(oldData);
          if (oldData) {
            let lastLogin = new Date()
            db.get('users')
              .find({ node_id: meResult.data.node_id })
              .assign({ result: meResult.data, access_token: accessToken, state: req.query.state, emails: mailR.data, last_login: lastLogin.toString() })
              .write()
            console.log(oldData.confirmed_email)
            res.send({ status: 'OK_ACCESS_TOKEN_AND_SAVED_SIGNED', nodeId: meResult.data.node_id, login: meResult.data.login, emails: mailR.data, confirmed_email: oldData.confirmed_email })
          } else {
            let accountCreated = new Date()
            let lastLogin = new Date()
            db.get('users')
              .push({ registered: false, result: meResult.data, node_id: meResult.data.node_id, access_token: accessToken, state: req.query.state, emails: mailR.data, confirmed_email: false, email_used: null, nano_account: null, account_created: accountCreated.toString(), last_login: lastLogin.toString(), dataSaved: null })
              .write()
            // { accessToken: accessToken, state: req.query.state, nodeId: meResult.node_id, userName: meResult.login, email: meResult.email}
            db.update('count', n => n + 1)
              .write()
            res.send({ status: 'OK_ACCESS_TOKEN_AND_SAVED', nodeId: meResult.data.node_id, login: meResult.data.login, emails: mailR.data })
          }
        }).catch((err) => {
          console.log(err)
          res.send(err)
        })
      }).catch((err) => {
        console.log(err)
        res.send(err)
      })
      // Send state back
      // Save to database with state
    }
  }).catch((err) => {
    console.error(err)
    res.send('ERR_ACCESS_TOKEN')
  })
})

app.get('/setUserRegistered', (req, res, next) => {
  db.get('users')
    .find({ node_id: req.query.node_id })
    .assign({ registered: true })
    .write()
})

app.get('/setupUserConfirmaion', (req, res, next) => {
  nanoClient._send('key_create').then(resAcc => {
    // console.log(resAcc)
    db.get('users')
      .find({ node_id: req.query.node_id })
      .assign({ confirmed_email: true, email_used: req.query.emailUsed, nano_account: resAcc })
      .write()
    let userData = db.get('users').find({ node_id: req.query.node_id }).value()
    let data = {
      access_token: userData.access_token,
      nodeId: userData.node_id,
      email_Used: userData.email_used,
      user_name: userData.result.login,
      avatar_url: userData.result.avatar_url,
      repos_url: userData.result.repos_url,
      gists_url: userData.result.gists_url,
      account_creation_date: userData.account_created
    }
    let objects = { ...data, ...resAcc }
    res.send(objects)
  }).catch(e => {
    console.log(e)
    res.send('Nano Account Creation Problem.')
  })
  // When signing user also assign confirmed_email to true
})
// Remove data once saved
app.get('/remove/sensData', (req, res, next) => {
  db.get('users')
    .find({ node_id: req.query.node_id })
    .assign({ access_token: '', nano_account: [] })
    .write()
})

app.get('/isUserConfirmed', (req, res, next) => {
  let user = db.get('users').find({ node_id: req.query.node_id }).value()
  res.send(user.confirmed_email)
  // When signing user also assign confirmed_email to true
})

app.get('/account/isOpened', (req, res, next) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  console.log(ip)
  // let data = JSON.parse(req.query.users_data)
  // console.log(req.query.user_account)
  nanoClient._send('account_info', { account: req.query.user_account }).then(resVal => {
    console.log(resVal)
    res.send(resVal)
  }).catch(e => {
    console.log(e)
  })
})

app.get('/account/balance', (req, res, next) => {
  // let data = JSON.parse(req.query.users_data)
  // console.log(req.query.user_account)
  nanoClient._send('account_balance', { account: req.query.user_account }).then(resVal => {
    console.log(resVal)
    let raw = 1000000000000000000000000000000
    let amountConversion = {
      mrai_balance: resVal.balance / raw,
      mrai_pending: resVal.pending / raw
    }
    res.send(amountConversion)
  }).catch(e => {
    console.log(e)
    res.send(e)
  })
})

app.get('/account/openAccount', (req, res, next) => {
  let data = JSON.parse(req.query.users_data)
  // console.log(req.query.user_account)
  nanoClient._send('accounts_pending', { accounts: [data.user_account] }).then(resVal => {
    console.log(resVal.blocks[data.user_account][0])
    if (resVal.blocks[data.user_account][0]) {
      nanoClient._send('work_generate', { hash: data.user_pubk }).then(workResult => {
        console.log(workResult)
        // console.log(data)
        nanoClient._send('block_create', {
          type: 'open',
          previous: data.user_pubk,
          key: data.user_prk,
          account: data.user_account,
          source: resVal.blocks[data.user_account][0],
          work: workResult.work,
          representative:
            'nano_1okq78j6kp5pbrytzyn3imxxwzrjy4wsisgjuhrjip8tfwmax18bpox83fw9'
        }).then(newBlock => {
          // console.log(newBlock.block)
          nanoClient._send('process', { block: newBlock.block }).then(processResult => {
            console.log(processResult)
            res.send(processResult)
          }).catch(e => {
            console.log(e)
            res.send(e)
          })
        }).catch(e => {
          console.log(e)
          res.send(e)
        })
      }).catch(e => {
        console.log(e)
        res.send(e)
      })
    } else {
      res.send('Before opening it you must send any amount of nano to this account first. The amount can be anything (Like $0.000002 worth of nano). It will be yours.')
    }
  }).catch(e => {
    console.log(e)
    res.send(e)
  })
})

app.get('/block/sendNano', (req, res, next) => {
  let data = JSON.parse(req.query.users_data)
  let userLdbData = db.get('users').find({ result: { login: data.selected_user.toLowerCase() } }).value()
  if (userLdbData) {
    sendNano(data, res, userLdbData)
  } else {
    res.send('USER_NANO_RECEIVER_NOT_FOUND')
  }
})
async function sendNano (params, res, userldb) {
  console.log(params.amount_sending)
  let amountSending = params.amount_sending * 1000000
  console.log(amountSending)
  nanoClient._send('mrai_to_raw', { amount: parseInt(amountSending).toString() }).then(resVal => {
    console.log('on mrai')
    console.log(resVal)
    nanoClient._send('account_info', { account: params.user_account, count: 1 }).then(info => {
      console.log('account info')
      console.log(info)
      nanoClient._send('work_generate', { hash: info.frontier }).then(workResult => {
        console.log(workResult)
        nanoClient._send('block_create', {
          type: 'send',
          key: params.useprk,
          account: params.user_account,
          destination: userldb.nano_account.account,
          balance: info.balance,
          amount: resVal.amount / 1000000,
          previous: info.frontier,
          work: workResult.work
        })
          .then(newBlock => {
            nanoClient._send('process', { block: newBlock.block }).then(processResult => {
              console.log(processResult.hash)
              let currTime = new Date()
              let dataToSend = {
                process_result: processResult,
                sender: params.sender_userName,
                receiver: params.selected_user,
                status: 'Sent Successfully',
                sender_pic: params.sender_avatar_pic,
                amount_sent: params.amount_sending.toString(),
                current_Time: currTime
              }
              db.get('tsxes')
                .push(dataToSend)
                .write()
              res.send(dataToSend)
            }).catch(e => {
              console.log(e)
              res.send(e)
            })
          })
          .catch(e => {
            console.log(e)
            res.send(e)
          })
      }).catch(e => {
        console.log(e)
        res.send(e)
      })
    }).catch(e => {
      console.log(e)
      res.send(e)
    })
  }).catch(e => {
    console.log(e)
    res.send(e)
  })
}
// app.get('/nanoWalletCreatedAndDataStitchSavedChecked', (req, res, next) => {
//   let user = db.get('users').find({ node_id: req.query.node_id }).value()
//   if (req.query.node_id) {
//     if (!user.nano_account) {
//       checkNanoAccount(user)
//     }
//   }
//   // When signing user also assign confirmed_email to true
// })

// function checkNanoAccount (userData) {
//   if (userData.nano_account) {
//     return 'Account Was Created'
//   } else {
//     nanoClient._send('key_create').then(resAcc => {
//       let data = {
//         access_token: userData.access_token,
//         nodeId: userData.node_id,
//         email_Used: userData.email_used,
//         user_name: userData.result.login,
//         avatar_url: userData.result.avatar_url,
//         repos_url: userData.result.repos_url,
//         gists_url: userData.result.gists_url,
//         account_creation_date: userData.account_created
//       }
//       let objects = { ...data, ...resAcc }
//       return objects
//     }).catch(e => {
//       console.log(e)
//       return 'Again a problem occured when created Nano Account'
//     })
//   }
// }

// function checkDataSaved () {
// Online mongodb stitch datasaved or not
// }

app.listen(3000)
