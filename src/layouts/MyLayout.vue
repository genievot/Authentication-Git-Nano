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
              v-if="isAccountOpened"
              class="bg-orange q-ml-sm"
              dense
              round
              @click="showNanoSendDialog = true"
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
          <span class="text-red">Account (Please store it yourself safely)</span>
        <q-input id="wallet-account" v-if="userWallet.account" standout @click.native="copyText('wallet-account')" v-model="userWallet.account" readonly>
        <template v-slot:prepend>
          <q-icon name="file_copy" />
        </template>
        </q-input>
        </q-card-section>
                <q-card-section align="center">
          <span class="text-red">Public Key (Please store it yourself safely)</span>
        <q-input id="wallet-public" standout v-model="userWallet.public" @click.native="copyText('wallet-public')" readonly>
        <template v-slot:prepend>
          <q-icon name="file_copy" />
        </template>
        </q-input>
        </q-card-section>
      <q-card-section align="center">
        <span class="text-red">Private Key (Please store it yourself safely)</span>
        <q-input id="wallet-private" standout v-model="userWallet.private" @click.native="copyText('wallet-private')" :type="isPwd ? 'password' : 'text'" readonly>
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

      <q-card-section v-if="!isAccountOpened" align="center">
        <q-btn color="grey-9" @click="openNanoAccount()" label="Open Nano Account">
          <q-icon
            name="person"
            class="cursor-pointer text-white"
          />
          </q-btn>
        </q-card-section>
        <q-card-section v-if="!isAccountOpened" align="center">
          <span>Opening this Nano Account will let you send or receive nanos from here (it's free), If the account is not opened then you will see this above button.</span>
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
    <!-- Transfer Nano dialog -->
      <q-dialog v-model="showNanoSendDialog" persistent  maximized>
      <q-card align="center">
        <q-card-section align="center">
          <q-btn
            fab-mini
            style="transform: translateY(-75%);"
            color="white text-black"
            icon="minimize"
            @click="showNanoSendDialog=false"
          />
        </q-card-section>
        <q-card-section>
          <div class="text-h6 row justify-center">Send Nano</div>
        </q-card-section>
        <q-card-section>
          <div class="q-pa-md" style="max-width: 80vw">

            <q-form
              @submit="onSubmit"
              @reset="onReset"
              class="q-gutter-md"
            >
              <div class="q-pa-md">
                <div class="q-gutter-md row justify-center">
                  <q-select
                    filled
                    v-model="selectedUser"
                    use-input
                    label="Start typing User Name"
                    hide-selected
                    fill-input
                    input-debounce="0"
                    :options="allUserNames"
                    @filter="filterFn"
                    hint="Mininum 1 character to trigger autocomplete"
                    style="width: 250px; padding-bottom: 32px"
                    :rules="[
                      val => val !== null && val !== '' || 'Please Select a User'
                    ]"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
              <q-input
                filled
                type="number"
                v-model.number="amountToSend"
                label="Amount to send in NANO*"
                lazy-rules
                :rules="[
                  val => val !== null && val !== '' || 'Please enter your value',
                  val => val > 0 || 'Please enter a real value'
                ]"
              />
              <div>
                <q-btn label="Send" type="submit" color="orange" icon="attach_money">
                  </q-btn>
              </div>
            </q-form>

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
      gitUserName: '',
      amountToSend: 0,
      filterUsers: [],
      isPwd: true,
      allUserNames: [],
      selectedUser: null,
      isAccountOpened: false
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
    },
    async copyText (txt) {
      let copyTextarea = document.querySelector(`#${txt}`)
      // copyTextarea.setAttribute('type', 'text')
      // console.log(copyTextarea)
      copyTextarea.disabled = false
      copyTextarea.focus()
      copyTextarea.select()
      try {
        var successful = await document.execCommand('copy')
        // console.log(successful)
        var msg = successful ? 'successful' : 'unsuccessful'
        alert('Testing code was copied ' + msg)
      } catch (err) {
        alert('Oops, unable to copy')
      } finally {
        copyTextarea.disabled = true
      }
    },
    onSubmit () {
      console.log('"Hello"')
      let dataGen = {
        selected_user: this.selectedUser,
        sender_userName: this.userWallet.user_name,
        user_account: this.userWallet.account,
        user_prk: this.userWallet.private,
        amount_sending: this.amountToSend
      }
      // console.log(dataGen)
      this.$axios.get(this.$backEnd + '/block/sendNano', { // AXIOS CALL
        params: {
          users_data: dataGen
        }
      }).then((response) => {
        console.log(response)
        // this.showNanoSendDialog = false
        // Resend confirmation email if already singed up but not confirmed
      }).catch((err) => {
        console.log(err)
      })
      // console.log(process.env.NINJA_API_KEY)
    },
    onReset () {
      console.log('"Hello"')
    },
    filterFn (val, update, abort) {
      if (val.length < 1) {
        abort()
        return
      }
      update(() => {
        let userName = val.toLowerCase()
        this.filterUsers = this.allUserNames.filter(v => v.toLowerCase().indexOf(userName) > -1)
      })
    },
    openNanoAccount () {
      let dataGen = {
        user_account: this.userWallet.account,
        user_prk: this.userWallet.private,
        user_pubk: this.userWallet.public
      }
      // console.log(dataGen)
      this.$axios.get(this.$backEnd + '/account/openAccount', { // AXIOS CALL
        params: {
          users_data: dataGen
        }
      }).then((response) => {
        console.log(response)
        // this.showNanoSendDialog = false
        // Resend confirmation email if already singed up but not confirmed
      }).catch((err) => {
        console.log(err)
      })
    }
  },
  mounted () {
    console.log(this.$i18n.locale)
    this.$stitchClient.auth.loginWithCredential(new this.$anonymousCredential()).then(user => {
      this.$db.collection('publicUserInfo').find({}).asArray().then((docs) => {
        console.log(docs)
        for (let index = 0; index < docs.length; index++) {
          this.allUserNames.push(docs[index].userName)
        }
        // this.allUsers = docs
        console.log('[MongoDB Stitch] Connected to Stitch')
        // window.location = this.$frontEnd
      }).catch(err => {
        this.$q.loading.hide()
        console.error(err)
      })
    })
    if (this.$q.localStorage.getItem('userSecDetails')) {
      this.notLogged = false
      let userSecData = this.$q.localStorage.getItem('userSecDetails')
      if (Array.isArray(userSecData)) {
        this.userWallet = userSecData[0]
      } else {
        this.userWallet = userSecData
      }
    } else {
      this.notLogged = true
    }
    this.$axios.get(this.$backEnd + '/account/isOpened', { // AXIOS CALL
      params: {
        user_account: this.userWallet.account
      }
    }).then((response) => {
      if (response.data.error === 'Account not found') {
        this.isAccountOpened = false
      } else {
        this.isAccountOpened = true
      }
    }).catch((err) => {
      console.log(err)
      this.$q.notify({
        color: 'warning',
        message: err
      })
    })
    console.log(this.$q.localStorage.getItem('userSecDetails'))
    // console.log(this.$q.localStorage.getItem('userLogged'))
  }
}
</script>

<style>
</style>
