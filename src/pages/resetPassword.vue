<template>
  <q-page padding>
    <!-- content -->
    <q-form
      @submit="onSubmit"
      class="q-gutter-md"
    >
      <q-input v-model="password" filled :type="isPwd ? 'password' : 'text'"
        hint= "Please enter your new password"
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
      <q-btn label="Reset Password" color="green" type="submit" outline class="q-ml-sm" />
    </div>
      </q-form>
  </q-page>
</template>

<script>
export default {
  name: 'ResetPassword',
  data () {
    return {
      isPwd: true,
      password: null
    }
  },
  methods: {
    onSubmit () {
      let emailPassClient = this.$stitchClient.auth.getProviderClient(this.$userPasswordAuthProviderClient.factory)
      emailPassClient.resetPassword(this.$route.query.token, this.$route.query.tokenId, this.password).then(() => {
        this.$q.notify({
          color: 'green',
          message: 'Successfully Resetted Passsord. You can close this tab now and got to ' + this.$frontEnd + ' for login.',
          timeout: 25000,
          icon: 'done'
        })
      }).catch(err => {
        this.$q.notify({
          color: 'red',
          message: err.message,
          timeout: 25000,
          icon: 'warning'
        })
        console.log('Error resetting password:', err)
      })
    }
  }
}
</script>

<style>
</style>
