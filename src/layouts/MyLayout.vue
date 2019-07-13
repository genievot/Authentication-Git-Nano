<template>
  <q-layout view="lHh Lpr lFf">
      <q-header elevated class="bg-white text-blue">
        <q-toolbar>
          <q-toolbar-title>
            <span class="text-black">{{ $t('title1') }}</span> {{ $t('title2') }}
          </q-toolbar-title>
          <div v-if="notLogged">
            <q-btn
              class="bg-green"
              dense
              round
              @click="showHideOauthDialog = true"
              aria-label="Make Transaction"
            >
              <q-icon name="keyboard_return" class="text-white"/>
            </q-btn>
          </div>
          <!-- Below... If user oauth is saved and working -->
          <div v-if="!notLogged">
            <q-btn
              class="bg-blue"
              dense
              round
              @click="showUserWalletDialog = true"
              aria-label="Show Account"
            >
              <q-icon name="person" class="text-white"/>
            </q-btn>
            <q-btn
              class="bg-orange q-ml-sm"
              dense
              round
              @click="leftDrawerOpen = !leftDrawerOpen"
              aria-label="Make Transaction"
            >
              <q-icon name="attach_money" class="text-white"/>
            </q-btn>
          </div>
          <!-- // If local token not found then show login button else show create transaction and history button -->
        </q-toolbar>
      </q-header>
      <!--Dialogs -->
      <!-- Wallet Viewer Dialog -->
    <q-dialog
      v-model="showUserWalletDialog"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-white text-blue-9">
        <q-bar class="bg-white">
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <div class="text-h6 row justify-center">Nano Wallet</div>
        </q-card-section>

        <q-card-section align="center">
          <span>Account</span>
        <q-input standout v-model="userWallet.account" readonly>
        <template v-slot:prepend>
          <q-icon name="file_copy" />
        </template>
        </q-input>
        </q-card-section>
                <q-card-section align="center">
          <span>Public Key</span>
        <q-input standout v-model="userWallet.public" readonly>
        <template v-slot:prepend>
          <q-icon name="file_copy" />
        </template>
        </q-input>
        </q-card-section>
      <q-card-section align="center">
        <span>Private Key</span>
        <q-input standout v-model="userWallet.private" :type="isPwd ? 'password' : 'text'" readonly>
        <template v-slot:prepend>
          <q-icon name="file_copy" />
        </template>
        </q-input>
        </q-card-section>
      <q-card-section align="center">
        <q-btn round color="green-9" @click="isPwd = !isPwd">
          <q-icon
            :name="isPwd ? 'visibility_off' : 'visibility'"
            class="cursor-pointer text-white"
          />
          </q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- Outh dialog -->
      <q-dialog v-model="showHideOauthDialog" persistent>
      <q-card>
        <q-card-section align="center">
          <q-btn
            fab-mini
            style="transform: translateY(-75%);"
            color="white text-black"
            icon="minimize"
            @click="showHideOauthDialog=false"
          />
        </q-card-section>
        <q-card-section>
          <div class="row no-wrap items-center">
            <div class="row">
              <q-btn color="black text-white" @click="loginToGitHub">
                <q-avatar left class="bg-white q-mr-sm">
                  <img src="https://cdn.iconscout.com/icon/free/png-256/github-153-675523.png">
                </q-avatar>
                <div>{{ $t('login') }}</div>
              </q-btn>
             </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop,
      notLogged: true,
      showHideOauthDialog: false,
      showUserWalletDialog: false,
      showNanoSendDialog: false,
      userWallet: '0',
      isPwd: true
    }
  },
  methods: {
    uuidv4 () {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    },
    loginToGitHub () {
      let url = 'https://github.com/login/oauth/authorize?client_id=7f585ab9aaa593afd277&state=' + this.uuidv4() + '&scope=user public_repo'
      // let win = window.open(url, '_blank')
      // win.focus()
      window.location = url
    }
  },
  mounted () {
    console.log(this.$i18n.locale)
    if (this.$q.localStorage.getItem('userSecDetails')) {
      this.notLogged = false
      this.userWallet = this.$q.localStorage.getItem('userSecDetails')
    } else {
      this.notLogged = true
    }
    console.log(this.$q.localStorage.getItem('userSecDetails'))
    // console.log(this.$q.localStorage.getItem('userLogged'))
  }
}
</script>

<style>
</style>
