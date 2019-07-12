<template>
  <q-page padding>
    <div class="flex flex-center">
      <div v-if="loginUser" class="row bg-indigo-5 text-white justify-center" style="width: 90vw" align="center">
        <span class="text-h5">This github id is already registered, You can Login.</span>
      </div>
  <div class="q-pa-md" style="max-width: 400px">
  <q-form
    @submit="onSubmit"
    class="q-gutter-md"
    v-if="signUser"
  >
    <q-select filled v-model="emailSelected" :options="selectEmail" label="Email" :rules="[
            val => val !== null && val !== '' || 'Please select an email']" />
    <q-input v-if="!resetPass && !resendConf" v-model="password" filled :type="isPwd ? 'password' : 'text'"
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
      <q-btn v-if="!loginUser && !resetPass && !resendConf" :disable="disableSignup" label="Sign up" type="submit" color="primary"/>
      <q-btn v-if="loginUser && !resendConf" label="Login" color="green" type="submit" outline class="q-ml-sm" />
      <q-btn v-if="loginUser && !resendConf" @click="resetPass = true; loginUser = false" label="Recover Password" color="green" flat class="q-ml-sm" />
      <q-btn v-if="resetPass && !loginUser" label="Reset" @click="recoverPassword()" color="green" class="q-ml-sm" />
      <q-btn v-if="resetPass && !loginUser" @click="resetPass = false; loginUser = true" label="Go Back" color="primary" flat class="q-ml-sm" />
      <q-btn v-if="resendConf && !loginUser && !resetPass" label="Resend confirmation email" @click="_resendConfirmationEmail()" color="orange" type="submit" outline />
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
      db: null
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
        console.log(response.data)
        this.$q.localStorage.set('userLogged', response.data)
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
            window.location = this.$frontEnd
            this.timer = void 0
          }, 3000)
        } else {
          // console.log(response)
          this.emailSelected = this.selectEmail[0]
          this.$q.localStorage.set('selectedEmail', this.emailSelected)
          if (response.data.status === 'OK_ACCESS_TOKEN_AND_SAVED_SIGNED') {
            this.loginUser = true
            if (response.data.confirmed_email === false) {
              this.resendConf = true
            }
            this.emailSelected = this.selectEmail[0]
            this.$q.localStorage.set('selectedEmail', this.emailSelected)
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
    onSubmit () {
      if (this.loginUser === false) {
        // create new account
        this.$q.loading.show({ message: 'Please wait, while sending you confirmation email.' })
        this.emailPassClient.registerWithEmail(this.emailSelected, this.password).then(() => {
          this.$q.localStorage.set('selectedEmail', this.emailSelected)
          this.$q.notify({
            color: 'green',
            message: 'Successfully sent account confirmation email! You can close this window now.',
            timeout: 25000,
            icon: 'done'
          })
          // Set User to registered
          this.$axios.get(this.$backEnd + '/setUserRegistered', { // AXIOS CALL
            params: {
              node_id: this.$q.localStorage.getItem('userLogged').nodeId
            }
          }).then((response) => {
            console.log(response)
            // Resend confirmation email if already singed up but not confirmed
          }).catch((err) => {
            console.log(err)
          })
          console.log('Successfully sent account confirmation email!')
          this.$q.loading.hide()
          this.disableSignup = true
        }).catch(err => {
          this.disableSignup = true
          console.log('Error registering new user:', err)
          this.$q.notify({
            color: 'red',
            message: err.message,
            icon: 'warning'
          })
          this.$q.loading.hide()
          if (err.message === 'name already in use') {
            this.$axios.get(this.$backEnd + '/isUserConfirmed', { // AXIOS CALL
              params: {
                node_id: this.$q.localStorage.getItem('userLogged').nodeId
              }
            }).then((response) => {
              console.log(response)
              // Resend confirmation email if already singed up but not confirmed
              if (response.data === false) {
                this._resendConfirmationEmail()
                this.disableSignup = true
              } else {
                this.$q.notify({
                  color: 'orange',
                  message: 'You can login at ' + this.$frontEnd + ' You can close this tab now.',
                  timeout: 25000,
                  icon: 'user'
                })
              }
              this.$q.loading.hide()
            }).catch((err) => {
              console.log(err)
              this.disableSignup = true
              this.$q.notify({
                color: 'red',
                message: err.message,
                icon: 'warning'
              })
              this.$q.loading.hide()
            })
          }
        })
      } else if (this.loginUser === true && this.resetPass === false) {
        let credential = new this.$userPasswordCredential(this.emailSelected, this.password)
        this.$q.localStorage.set('authCredentials', credential)
        this.$stitchClient.auth.loginWithCredential(credential).then((authedUser) => {
          this.$q.localStorage.set('userAllocatedId', authedUser)
          this.db.collection('userInfo').find({}).asArray().then((docs) => {
            console.log(docs)
            console.log('[MongoDB Stitch] Connected to Stitch')
          }).catch(err => {
            console.error(err)
          })
          // this.db.collection('globalTxs').updateOne({ user_auth_id: authedUser.id })
          // this.db.collection('nanoWallets').updateOne({ user_auth_id: authedUser.id })
        }).catch((err) => {
          console.log(err)
          this.$q.notify({
            color: 'red',
            message: err.message,
            icon: 'warning'
          })
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
        this.$q.notify({
          color: 'red',
          message: err.message,
          icon: 'warning'
        })
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
    this.db = this.$stitchClient.getServiceClient(this.$remoteMongoClient.factory, 'mongodb-atlas').db('nanoGit')
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
