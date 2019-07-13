<template>
  <q-page padding>
    <!-- Create nano wallet here and save it for user -->
    <div class="row justify-center" align ='center'>
     <q-btn @click="goToWebsite()" label="Go Back to website" color="primary"/>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'confirmEmail',
  mounted () {
    // this.db = this.$stitchClient.getServiceClient(this.$remoteMongoClient.factory, 'mongodb-atlas').db('nanoGit')
    this.$q.loading.show({
      message: 'Please wait while confirming you address'
    })
    this.confirmEmail()
  },
  methods: {
    goToWebsite () {
      window.location = this.$frontEnd
    },
    confirmEmail () {
      let emailPassClient = this.$stitchClient.auth.getProviderClient(this.$userPasswordAuthProviderClient.factory)
      emailPassClient.confirmUser(this.$route.query.token, this.$route.query.tokenId).then(() => {
        this.$axios.get(this.$backEnd + '/setupUserConfirmaion', { // AXIOS CALL
          params: {
            node_id: this.$q.localStorage.getItem('userLogged').nodeId,
            emailUsed: this.$q.localStorage.getItem('selectedEmail')
          }
        }).then((response) => {
          // console.log(this.$q.localStorage.getItem('selectedEmail'))
          // console.log(response)
          this.$q.localStorage.set('userSecDetails', response.data)
          // console.log(this.$q.localStorage.getItem('authCredentials'))
          this.$stitchClient.auth.loginWithCredential(this.$q.localStorage.getItem('authCredentials')).then((authedUser) => {
            let moreData = {
              user_auth_id: authedUser.id
            }
            let dataToInsert = { ...response.data, ...moreData }
            let publicDataToInsert = { account: response.data.account, userName: response.data.user_name, avatar_url: response.data.avatar_url, user_auth_id: authedUser.id }
            try {
              this.$db.collection('userInfo').insertOne(dataToInsert)
              this.$db.collection('publicUserInfo').insertOne(publicDataToInsert)
            } catch (e) {
              console.log(e)
            }
          }).catch(err => {
            console.error(err)
          })
        }).catch((err) => {
          console.log(err)
          this.$q.notify({
            color: 'warning',
            message: 'A problem while saving data to database, But your account is fully functional and working, YAY!',
            timeout: 25000,
            icon: 'warning'
          })
        })
        console.log('Done')
        this.$q.loading.hide()
        this.$q.notify({
          color: 'green',
          message: 'Successfully verified, Now you can close this window and login at ' + this.$frontEnd,
          timeout: 25000,
          icon: 'done'
        })
      }).catch((err) => {
        this.$q.loading.hide()
        this.$q.notify({
          color: 'red',
          message: err.message,
          timeout: 25000,
          icon: 'warning'
        })
        this.$q.notify({
          color: 'red',
          message: 'Please try again with signup with this email, To get new confirmation url got to ' + this.$frontEnd,
          timeout: 25000,
          icon: 'warning'
        })
      })
    }
  }
}
</script>

<style>
</style>
