<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <div class="row justify-center" align="center">
        <q-toolbar>
          <q-toolbar-title @click.native="gotoHome()" class="text-blue">
            <span class="text-black">{{ $t('title1') }}</span> {{ $t('title2') }}
          </q-toolbar-title>
        </q-toolbar>
      </div>
      <!-- Authorize user and redirect here,
      Then make axios request and send token to server with state
      Shows a popup to setup a password, then confirm it

      Store data locally if any request comes back
      Close window after 5 seconds
     -->
    </q-page-container>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'LayoutRedirect',
  data () {
    return {
      leftDrawer: true
    }
  },
  methods: {
    gotoHome () {
      window.location = this.$frontEnd
    }
  },
  mounted () {
  }
}
</script>
