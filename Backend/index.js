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
const nanoClient = new NanoClient({ apiKey: process.env.NINJA_API_KEY })
const db = low(adapter)
// Set some defaults (required if your JSON file is empty)
db.defaults({ signedUsers: [], users: [], count: 0 })
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
              .push({ registered: false, result: meResult.data, node_id: meResult.data.node_id, access_token: accessToken, state: req.query.state, emails: mailR.data, confirmed_email: false, email_used: null, nano_account: null, account_created: accountCreated.toString(), last_login: lastLogin.toString() })
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

app.get('/isUserConfirmed', (req, res, next) => {
  let user = db.get('users').find({ node_id: req.query.node_id }).value()
  res.send(user.confirmed_email)
  // When signing user also assign confirmed_email to true
})

// app.get('/auth/getUserInfo', (req, res, next) => {
//   axios({
//     // make a POST request
//     method: 'get',
//     // to the Github authentication API, with the client ID, client secret
//     // and request token
//     url: `https://api.github.com/user`,
//     // Set the content type header, so that we get the response in JSOn
//     headers: {
//          Authorization: 'token ' + req.query
//     }}).then((meResult) => {
//
//     }).catch((err) => {
//
//     })
// })

app.listen(3000)
