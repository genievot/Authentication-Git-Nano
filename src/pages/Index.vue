<template>
  <q-page class="flex flex-center">
  </q-page>
</template>

<style>
</style>

<script>
export default {
  name: 'PageIndex',
  mounted () {
    // console.log(this.$q.localStorage.getAll())
    this.$stitchClient.auth.loginWithCredential(new this.$anonymousCredential()).then(user => {
      console.log(user.id)
    })
    // console.log(this.$q.localStorage.getItem('userLogged'))
    // console.log(this.$q.localStorage.getItem('userSecDetails'))
  }
}
</script>
