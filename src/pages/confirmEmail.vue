<template>
  <q-page padding>
    <!-- Create nano wallet here and save it for user -->
    <div class="row justify-center" align ='center'>
     <q-btn @click="goToWebsite()" label="Go Back to website" color="primary" class="q-ma-sm"/>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'confirmEmail',
  data () {
    return {
    }
  },
  mounted () {
    // this.db = this.$stitchClient.getServiceClient(this.$remoteMongoClient.factory, 'mongodb-atlas').db('nanoGit')
    this.confirmEmail()
  },
  methods: {
    goToWebsite () {
      window.location = this.$frontEnd
    },
    onSubmit () {
      console.log('Submit')
    },
    onReset () {
      // Reset
    },
    confirmEmail () {
      this.$q.loading.show({
        message: 'Please wait while confirming you address'
      })
      let emailPassClient = this.$stitchClient.auth.getProviderClient(this.$userPasswordAuthProviderClient.factory)
      emailPassClient.confirmUser(this.$route.query.token, this.$route.query.tokenId).then(() => {
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
        // this.$q.notify({
        //   color: 'red',
        //   message: 'Please try again with signup with this email, To get new confirmation url, Go to ' + this.$frontEnd,
        //   timeout: 25000,
        //   icon: 'warning'
        // })
      })
    }
  }
}
</script>

<style>
</style>
