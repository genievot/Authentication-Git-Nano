<template>
  <q-page padding>
    <div class="flex flex-center">
      <div v-if="loginUser" class="row bg-indigo-5 text-white justify-center" style="width: 90vw" align="center">
        <!-- <span class="text-h5">This github id is already registered, You can Login.</span> -->
      </div>
  <div class="q-pa-md" style="max-width: 400px">
  <q-form
    @submit="onSubmit"
    class="q-gutter-md"
    v-if="signUser"
  >
    <q-select v-if="!goToHomePageButtonVisible" filled v-model="emailSelected" :options="selectEmail" label="Email" :rules="[
            val => val !== null && val !== '' || 'Please select an email']" />
    <q-input v-if="!resetPass && !resendConf && !goToHomePageButtonVisible" v-model="password" filled :type="isPwd ? 'password' : 'text'"
      :hint= "loginUser ? 'Choose your correct email and enter Password to Login' : 'Create new Password'"
      :rules="[
        val => val !== null && val !== '' || 'Please type your Password',
        val => val.length >= 6 && val.length <= 50 || 'Please type a password in between 6 to 50 characters'
      ]"
    >
    <template v-slot:append>
      <q-icon
        :name="isPwd ? 'visibility_off' : 'visibility'"
        class="cursor-pointer"
        @click="isPwd = !isPwd"
      />
    </template>
  </q-input>
    <div class="row justify-center" align="center">
      <q-btn v-if="!loginUser && !resetPass && !resendConf && !goToHomePageButtonVisible" :disable="disableSignup" label="Sign up" type="submit" color="primary"/>
      <q-btn v-if="goToHomePageButtonVisible" label="Goto Home Page" to="/" color="primary"/>
      <q-btn v-if="loginUser && !resendConf && !goToHomePageButtonVisible" label="Login" color="green" type="submit" outline class="q-ml-sm" />
      <q-btn v-if="loginUser && !resendConf && !goToHomePageButtonVisible" @click="resetPass = true; loginUser = false" label="Recover Password" color="green" flat class="q-ml-sm" />
      <q-btn v-if="resetPass && !loginUser && !goToHomePageButtonVisible" label="Reset" @click="recoverPassword()" color="green" class="q-ml-sm" />
      <q-btn v-if="resetPass && !loginUser && !goToHomePageButtonVisible" @click="resetPass = false; loginUser = true" label="Go Back" color="primary" flat class="q-ml-sm" />
      <q-btn v-if="resendConf && !loginUser && !resetPass && !goToHomePageButtonVisible" label="Resend confirmation email" @click="_resendConfirmationEmail()" color="orange" type="submit" outline />
    </div>
  </q-form>

</div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'tokenHandle',
  data () {
    return {
      emailSelected: null,
      selectEmail: [],
      signUser: false,
      loginUser: false,
      password: null,
      isPwd: true,
      resetPass: false,
      disableSignup: false,
      resendConf: false,
      emailPassClient: null,
      goToHomePageButtonVisible: false
    }
  },
  methods: {
    sendSaveUserData () {
      this.$axios.get(this.$backEnd + '/getAccessToken', { // AXIOS CALL
        params: {
          code: this.$route.query.code,
          state: this.$route.query.state
        }
      }).then((response) => {
        // console.log(response.data)
        this.$q.localStorage.set('userLogged', response.data.nodeId)
        for (var i = 0; i < response.data.emails.length; i++) {
          if (response.data.emails[i].visibility === 'private' || response.data.emails[i].visibility === 'public') {
            this.selectEmail.push(response.data.emails[i].email)
          }
        }
        if (this.selectEmail.length <= 0) {
          this.$q.loading.hide()
          this.$q.notify({
            color: 'red',
            message: 'Please add a private or public email on github first.',
            icon: 'warning'
          })
          this.signUser = false
          this.timer = setTimeout(() => {
            // window.location = this.$frontEnd
            this.timer = void 0
          }, 3000)
        } else {
          // console.log(response)
          this.emailSelected = this.selectEmail[0]
          // this.$q.localStorage.set('selectedEmail', this.emailSelected)
          if (response.data.status === 'OK_ACCESS_TOKEN_AND_SAVED_SIGNED') {
            this.loginUser = true
            if (response.data.registered === false) {
              // this.resendConf = true
              this.loginUser = false
              this.resetPass = false
              this.resendConf = false
            }
            this.emailSelected = this.selectEmail[0]
            // this.$q.localStorage.set('selectedEmail', this.emailSelected)
          }
          this.$q.loading.hide()
          this.signUser = true
        }
        // Ask to verify email and add password with stitch then...
      }).catch((error) => {
        console.log(error)
        this.$q.notify({
          color: 'red',
          message: 'A problem occured, Go to ' + this.$frontEnd + ' and try again',
          timeout: 25000,
          icon: 'warning'
        })
        this.$q.loading.hide()
      })
    },
    setUserRegistered () {
      this.$axios.get(this.$backEnd + '/setUserRegistered', { // AXIOS CALL
        params: {
          state: this.$route.query.state
        }
      }).then((response) => {
        console.log(response)
        console.log('Successfully sent account confirmation email!')
        this.$q.loading.hide()
      // Resend confirmation email if already singed up but not confirmed
      }).catch((err) => {
        console.log(err)
        this.$q.loading.hide()
      })
    },
    async onSubmit () {
      if (this.loginUser === false) {
        // create new account
        this.$q.loading.show({ message: 'Please wait, while sending you confirmation email.' })
        this.emailPassClient.registerWithEmail(this.emailSelected, this.password).then(() => {
          // let credential = new this.$userPasswordCredential(this.emailSelected, this.password)
          // this.$q.sessionStorage.set('authCredentials', credential)
          // this.$q.sessionStorage.set('selectedEmail', this.emailSelected)
          this.$q.notify({
            color: 'green',
            message: 'Successfully sent account confirmation email! You can close this window now.',
            timeout: 25000,
            icon: 'done'
          })
          this.$q.loading.hide()
          this.setUserRegistered()
          this.disableSignup = true
        }).catch(err => {
          this.disableSignup = true
          console.log('Error registering new user:', err)
          if (!this.resendConf) {
            this.$q.notify({
              color: 'red',
              message: err.message,
              icon: 'warning'
            })
          }
          this.$q.loading.hide()
          if (err.message === 'name already in use') {
            this.setUserRegistered()
            this._resendConfirmationEmail()
            // this.$axios.get(this.$backEnd + '/isUserConfirmed', { // AXIOS CALL
            //   params: {
            //     state: this.$route.query.state
            //   }
            // }).then((response) => {
            //   console.log(response)
            //   // Resend confirmation email if already singed up but not confirmed
            //   if (response.data === true) {
            //     this._resendConfirmationEmail()
            //     this.disableSignup = true
            //   }
            //   // else {
            //   //   if (!this.resendConf) {
            //   //     this.$q.notify({
            //   //       color: 'orange',
            //   //       message: 'You can login at ' + this.$frontEnd + ' You can close this tab now.',
            //   //       timeout: 25000,
            //   //       icon: 'user'
            //   //     })
            //   //   }
            //   // }
            //   this.$q.loading.hide()
            // }).catch((err) => {
            //   console.log(err)
            //   this.disableSignup = true
            //   this.$q.notify({
            //     color: 'red',
            //     message: err.message,
            //     icon: 'warning'
            //   })
            //   this.$q.loading.hide()
            // })
          }
        })
      } else if (this.loginUser === true && this.resetPass === false) {
        this.$q.loading.show()
        let credential = new this.$userPasswordCredential(this.emailSelected, this.password)
        this.$q.sessionStorage.set('authCredentials', credential)
        // console.log(credential)
        this.$stitchClient.auth.loginWithCredential(credential).then((authedUser) => {
          this.$q.sessionStorage.set('userAllocatedId', authedUser.id)
          this.$db.collection('userInfo').find({ user_auth_id: authedUser.id }).asArray().then((docs) => {
            // console.log(docs)
            // this.$q.loading.hide()
            this.$q.loading.show({ message: 'Accessing data, Please wait...' })
            // console.log(docs)
            // Checking if user have already saved data, If so then get node if from it.
            if (docs.length > 0) { // check if nano account created **/ (and then 2nd condition) Lastest updation can be removed
              // console.log(docs.account)
              let paramsData = null
              // console.log(docs)
              if (!docs[0].account) {
                paramsData = {
                  state: this.$route.query.state,
                  email_used: this.emailSelected,
                  create_wallet: true
                }
              } else {
                paramsData = {
                  state: this.$route.query.state,
                  email_used: this.emailSelected
                }
              }
              this.$q.sessionStorage.set('userSecDetails', docs)
              // get latest details...
              this.$axios.get(this.$backEnd + '/setupUserConfirmaion', {
                params: paramsData
              }).then((response) => {
                // console.log(response.data)
                let userId = {
                  user_auth_id: authedUser.id
                }
                let dataStringify = response.data
                this.$q.loading.show({ message: 'Updating latest data from Github...' })
                // console.log(dataStringify)
                this.$db.collection('userInfo').updateOne(userId, { '$set': dataStringify }).then((result) => {
                  const { matchedCount, modifiedCount } = result
                  // console.log(result)
                  if (matchedCount && modifiedCount) {
                    this.$db.collection('userInfo').find({ user_auth_id: authedUser.id }).asArray().then((docs) => {
                      // console.log(docs)
                      this.$q.sessionStorage.set('userSecDetails', docs)
                      this.$axios.get(this.$backEnd + '/remove/sensData', { // AXIOS CALL
                        params: {
                          state: this.$route.query.state
                        }
                      }).then((res) => {
                        let publicDataToInsert = { account: docs[0].account, user_name: response.data.user_name, avatar_url: response.data.avatar_url, user_auth_id: authedUser.id }
                        this.$db.collection('publicUserInfo').find({ user_auth_id: authedUser.id }).asArray().then((publicDocs) => {
                          if (publicDocs.length > 0) {
                            this.$q.loading.show({ message: 'Updating public info...' })
                            this.$db.collection('publicUserInfo').updateOne(userId, { '$set': publicDataToInsert }).then((result) => {
                              const { matchedCount, modifiedCount } = result
                              // console.log(result)
                              if (matchedCount && modifiedCount) {
                                console.log('Wallet Not in server anymore...')
                                this.$q.loading.hide()
                                this.goToHomePageButtonVisible = true
                              }
                            }).catch(err => {
                              console.log(err)
                              console.log('Wallet Not in server anymore...')
                              this.$q.loading.hide()
                              this.goToHomePageButtonVisible = true
                            })
                          } else {
                            this.$q.loading.show({ message: 'Adding Public Info...' })
                            this.$db.collection('publicUserInfo').insertOne(publicDataToInsert).then(res => {
                              // console.log(res)
                              console.log('Wallet Not in server anymore...')
                              this.$q.loading.hide()
                              this.goToHomePageButtonVisible = true
                            }).catch(err => {
                              console.log(err)
                            })
                          }
                        })
                      }).catch(err => {
                        console.log(err)
                        this.$q.loading.hide()
                        this.goToHomePageButtonVisible = true
                      })
                      // console.log('[MongoDB Stitch] Connected to Stitch')
                    }).catch(err => {
                      this.$q.loading.hide()
                      console.error(err)
                    })
                  } else {
                    this.$q.loading.hide()
                  }
                  // console.log('Wallet Not in server anymore...')
                }).catch(err => {
                  console.log(err)
                })
              }).catch(e => {
                console.log(e)
                this.$q.notify({
                  color: 'red',
                  message: e.message,
                  icon: 'warning'
                })
              })
            } else { // If data is not there then do the insertion
              // Insertion
              try {
                console.log('Hello User')
                this.$axios.get(this.$backEnd + '/setupUserConfirmaion', {
                  params: {
                    state: this.$route.query.state,
                    email_used: this.emailSelected,
                    create_wallet: true
                  }
                }).then((response) => {
                  // console.log(response.data)
                  let userId = {
                    user_auth_id: authedUser.id
                  }
                  let dataStringify = { ...response.data, ...userId }
                  this.$q.loading.show({ message: 'Adding data, please wait...' })
                  this.$db.collection('userInfo').insertOne(dataStringify).then(res => {
                    this.$axios.get(this.$backEnd + '/remove/sensData', { // AXIOS CALL
                      params: {
                        state: this.$route.query.state
                      }
                    }).then((res) => {
                      console.log('Wallet Not in server anymore...')
                      this.$q.sessionStorage.set('userSecDetails', dataStringify)
                      let publicDataToInsert = { account: response.data.account, user_name: response.data.user_name, avatar_url: response.data.avatar_url, user_auth_id: authedUser.id }
                      this.$q.loading.show({ message: 'Adding public data...' })
                      this.$db.collection('publicUserInfo').insertOne(publicDataToInsert).then(res => {
                        this.$q.loading.hide()
                        console.log('Wallet Not in server anymore...')
                        this.$q.loading.hide()
                        this.goToHomePageButtonVisible = true
                      })
                    }).catch(err => {
                      console.log(err)
                    })
                  })
                })
              } catch (e) {
                console.log(e)
              }
            }
            // console.log('[MongoDB Stitch] Connected to Stitch')
            // window.location = this.$frontEnd
          }).catch(err => {
            this.$q.loading.hide()
            console.error(err)
          })
          // console.log('Signed')
          // }).catch((e) => {})
          // this.db.collection('globalTxs').updateOne({ user_auth_id: authedUser.id })
          // this.db.collection('nanoWallets').updateOne({ user_auth_id: authedUser.id })
        }).catch((err) => {
          this.$q.loading.hide()
          console.log(err)
          if (err.message === 'confirmation required') {
            this.resendConf = true
            this.resetPass = false
            this.loginUser = false
          } else {
            this.$q.notify({
              color: 'red',
              message: err.message,
              icon: 'warning'
            })
          }
        })
      }
    },
    // _loginUser () {
    // },
    _resendConfirmationEmail () {
      this.$q.loading.show({
        message: 'Please wait while sending email..'
      })
      this.emailPassClient.resendConfirmationEmail(this.emailSelected).then(() => {
        this.$q.notify({
          color: 'green',
          message: 'Resent confirmation Email.' + ' You can close this tab now.',
          timeout: 25000,
          icon: 'done'
        })
        this.$q.loading.hide()
      }).catch((err) => {
        console.log(err)
        this.$q.loading.hide()
        // this.$axios.get(this.$backEnd + '/setupUserConfirmaion', { // AXIOS CALL
        //   params: {
        //     node_id: this.$q.localStorage.getItem('userLogged'),
        //     emailUsed: this.$q.localStorage.getItem('selectedEmail')
        //   }
        // }).then((response) => {

        // })
        this.$q.notify({
          color: 'red',
          message: err.message,
          icon: 'warning'
        })
        if (this.err.errCodeName === 'UserAlreadyConfirmed') {
          this.loginUser = true
        }
        this.$q.loading.hide()
        console.log(err)
      })
    },
    recoverPassword () {
      this.$q.loading.show({
        message: 'Please wait while sending link to reset password at your email..'
      })
      this.emailPassClient.sendResetPasswordEmail(this.emailSelected).then(() => {
        this.$q.localStorage.set('selectedEmail', this.emailSelected)
        this.$q.notify({
          color: 'green',
          message: 'Sent Link to Email For resetting password.' + ' You can close this tab now.',
          timeout: 25000,
          icon: 'done'
        })
        this.$q.loading.hide()
      }).catch((err) => {
        this.$q.notify({
          color: 'red',
          message: err.message,
          icon: 'warning'
        })
        this.$q.loading.hide()
        console.log(err)
      })
    },
    beforeDestroy () {
      if (this.timer !== void 0) {
        clearTimeout(this.timer)
        this.$q.loading.hide()
      }
    }
  },
  mounted () {
    console.log('Hello')
    this.emailPassClient = this.$stitchClient.auth.getProviderClient(this.$userPasswordAuthProviderClient.factory)
    // this.db = this.$stitchClient.getServiceClient(this.$remoteMongoClient.factory, 'mongodb-atlas').db('nanoGit')
    this.$q.loading.show({
      message: 'Please wait while getting your information ready.'
    })
    // console.log(this.$route.query)
    this.sendSaveUserData()
  }
}
</script>

<style>
</style>
