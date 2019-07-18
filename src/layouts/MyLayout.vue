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
              @click="getBalance(); showNanoSendDialog = true"
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
          <div class="text-h6 row justify-center">Nano Wallet
            <q-btn
              class="bg-green text-white q-ml-sm"
              :loading="!gotAccountBalance"
              size="small"
              dense
              icon="account_balance_wallet"
              round
              @click="getBalance(); showUserWalletDialog = true"
              aria-label="Show Account"
            >
              <q-popup-proxy v-if="this.accountBalances">
                <q-banner>
                  <div class="row justify-center">
                  <span class='text-h6 text-weight-light text-grey-9'>Balance:&nbsp;</span>
                  <span class='text-h6 text-weight-light text-green'>{{this.accountBalances.mrai_balance}}</span>
                  <span class='text-h6 text-weight-light text-grey-8'>&nbsp;NANO</span>
                  </div>
                  <q-separator/>
                  <div class="row justify-center">
                  <span class='text-h6 text-weight-light text-grey-9'>Pending:&nbsp;</span>
                  <span class='text-h6 text-weight-light text-red-4'>{{this.accountBalances.mrai_pending}}</span>
                  <span class='text-h6 text-weight-light text-grey-8'>&nbsp;NANO</span>
                  </div>
                </q-banner>
              </q-popup-proxy>
            </q-btn>
            </div>
        </q-card-section>

        <q-card-section align="center">
          <span class="text-red">Account (Please store it yourself safely)</span>
        <q-input id="wallet-account" v-if="userWallet.account" standout @click.native="copyText('wallet-account')" v-model="userWallet.account" readonly>
        <template v-slot:prepend>
          <q-icon name="file_copy" />
        </template>
        </q-input>
        <div class="row justify-center q-ma-sm">
         <q-btn class="text-green bg-white" @click="gotoExplorer()" round icon="launch" />
        </div>
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
        <q-btn :loading="loadingOnOpenAcc" color="grey-9 text-white" @click="openNanoAccount()" icon="person" label="Open Nano Account">
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
        <div v-if="accountBalances" class="row justify-center">
          <span class='text-h6 text-weight-light text-grey-9'>Balance:&nbsp;</span>
          <q-chip class='text-h6 text-weight-light text-green bg-grey-2' @click.native="amountToSend = accountBalances.mrai_balance">{{this.accountBalances.mrai_balance}}</q-chip>
          <span class='text-h6 text-weight-light text-grey-8'>&nbsp;NANO</span>
        </div>
        <div v-if="accountBalances" class="row justify-center">
          <span class='text-h6 text-weight-light text-grey-9'>Pending:&nbsp;</span>
          <span class='text-h6 text-weight-light text-red-4'>{{this.accountBalances.mrai_pending}}</span>
          <span class='text-h6 text-weight-light text-grey-8'>&nbsp;NANO</span>
        </div>
        </q-card-section>
        <q-card-section>
          <div class="q-pa-md" style="max-width: 80vw">
            <q-form
              @submit="onSubmit"
              @reset="onReset"
              class="q-gutter-md"
            >
              <div class="q-pa-md">
                <div class="q-gutter-md justify-center">
                  <div class="row justify-center">
                  <q-avatar v-if="userExists" square>
                    <img @click="gotoGitAccount()" :src="avatarUrl">
                  </q-avatar>
                  </div>
                  <div class="row justify-center">
                    <q-btn-toggle
                      v-model="toggleDefaultButton"
                      class="my-custom-toggle"
                      no-caps
                      rounded
                      unelevated
                      toggle-color="primary"
                      color="white"
                      text-color="primary"
                      :options="[
                        {label: 'Git User', value: 'git'},
                        {label: 'Address', value: 'address'}
                      ]"
                    />
                  </div>
                  <div class="row justify-center">
                    <q-input
                    v-if="toggleDefaultButton=='address'"
                    filled
                    type="text"
                    placeholder= 'nano_'
                    v-model="addressToSend"
                    label="Destination Address, e.g -> nano_0000000....."
                    lazy-rules
                    :rules="[
                      val => val !== null && val !== '' || 'Please enter nano account address'
                    ]"
                  />
                  </div>
                  <div class="row justify-center">
                    <q-select
                      v-if="toggleDefaultButton=='git'"
                      @input="selectedAUser()"
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
                            {{ showUserSearchResults }}
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>
                  </div>
                </div>
              </div>
              <div class="justify-center "></div>
              <q-input
                filled
                type="number"
                step="0.000001"
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
    <q-dialog v-model="alertUserDialogShow" persistent transition-show="scale" transition-hide="scale">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm!</div>
        </q-card-section>

        <q-card-section>
          <span class="text-weight-bold"> You should close all tabs and windows of this website when you are not using it! </span>
        This website store solid information that is easy to view but once you close the website and all opened tabs and pages of this website then all solid information will be removed,
        I will not be responsible for the loss of your data.
        </q-card-section>
        <q-card-section>
        Only Those transactions which done using Github Username will show here,
        For others please visit the an explorer like nanocrawler.cc or nanonode.co,
        <span class="text-weight-bold"> Thank you! </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" @click="acceptedDialog()" />
        </q-card-actions>
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
      isAccountOpened: false,
      accountBalances: null,
      loadingOnOpenAcc: false,
      gotAccountBalance: false,
      showUserSearchResults: 'No Results',
      userExists: false,
      allUsers: [],
      avatarUrl: null,
      toggleDefaultButton: 'git',
      addressToSend: '',
      selectedAddress: null,
      alertUserDialogShow: false
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
        alert('Value copy operation is ' + msg)
      } catch (err) {
        alert('Oops, unable to copy')
      } finally {
        copyTextarea.disabled = true
      }
    },
    onSubmit () {
      // console.log('"Hello"')
      if (this.toggleDefaultButton === 'git') {
        let indexOfUser = this.allUserNames.indexOf(this.selectedUser)
        this.selectedAddress = this.allUsers[indexOfUser].account
        this.sendNanoToUser(this.selectedAddress, this.selectedUser)
      } else {
        this.selectedAddress = this.addressToSend.trim()
        this.sendNanoToUser(this.selectedAddress, '$Nano_Address')
      }
      // console.log(process.env.NINJA_API_KEY)
    },
    sendNanoToUser (address, name) {
      this.$q.loading.show()
      let dataGen = {
        selected_address: address, // Selected address is the address nano_00000 of the user (receiver)
        sender_user_name: this.userWallet.user_name,
        sender_avatar_pic: this.userWallet.avatar_url,
        user_account: this.userWallet.account,
        user_prk: this.userWallet.private,
        amount_sending: this.amountToSend,
        selected_user_name: name,
        type: 'git'
      }
      // console.log(dataGen)
      if (this.selectedUser === this.userWallet.user_name) {
        this.$q.notify({
          color: 'orange',
          message: 'Please do not send to your own account'
        })
      } else {
        this.$axios.get(this.$backEnd + '/block/sendNano', { // AXIOS CALL
          params: {
            users_data: dataGen
          }
        }).then((response) => {
          console.log(response)
          if (!response.data.process_result.error) {
            this.$q.notify({
              color: 'green',
              message: response.data.status
            })
            this.$q.loading.hide()
            this.getBalance()
            this.$stitchClient.auth.loginWithCredential(this.$q.sessionStorage.getItem('authCredentials')).then((authedUser) => {
              let moreData = {
                user_auth_id: authedUser.id
              }
              let dataToInsert = { ...response.data, ...moreData }
              try {
                this.$db.collection('globalTxs').insertOne(dataToInsert)
              } catch (e) {
                console.log(e)
              }
            }).catch(err => {
              console.error(err)
            })
          } else {
            this.$q.notify({
              color: 'red',
              message: 'A problem occured while sending block.'
            })
          }
          // this.showNanoSendDialog = false
          // Resend confirmation email if already singed up but not confirmed
        }).catch((err) => {
          console.log(err)
          this.$q.notify({
            color: 'warning',
            message: err
          })
          this.$q.loading.hide()
        })
      }
    },
    onReset () {
      console.log('"Hello"')
    },
    filterFn (val, update, abort) {
      if (val.length < 1) {
        abort()
        return
      }
      // console.log(val)
      update(() => {
        let userName = val.toLowerCase()
        this.filterUsers = this.allUserNames.filter(v => v.toLowerCase().indexOf(userName) > -1)
      })
      this.showUserSearchResults = 'Please wait...'
      this.$stitchClient.auth.loginWithCredential(new this.$anonymousCredential()).then(user => {
        this.$db.collection('publicUserInfo').find({ user_name: { $regex: new RegExp('/^' + val + '/') } }).asArray().then((docs) => {
          // console.log(docs)
          this.allUsers = docs
          this.allUserNames = []
          for (let index = 0; index < docs.length; index++) {
            this.allUserNames.push(docs[index].user_name)
          }
          if (!this.allUserNames) {
            this.showUserSearchResults = 'No Results'
          }
          // this.allUsers = docs
          // window.location = this.$frontEnd
        }).catch(err => {
          this.$q.loading.hide()
          console.error(err)
        })
      })
    },
    openNanoAccount () {
      this.loadingOnOpenAcc = true
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
        // console.log(response)
        this.loadingOnOpenAcc = false
        if (!response.data.error) {
          if (response.data.hash) {
            this.isAccountOpened = true // Make the send button visible
            this.$q.notify({
              color: 'green',
              message: response.data.hash
            })
          } else {
            this.$q.notify({
              color: 'green',
              message: response.data
            })
          }
        } else {
          this.$q.notify({
            color: 'warning',
            message: response.data.error
          })
        }
        // this.isAccountOpened = true
        // Resend confirmation email if already singed up but not confirmed
      }).catch((err) => {
        console.log(err)
        this.loadingOnOpenAcc = false
        this.$q.notify({
          color: 'warning',
          message: err
        })
      })
    },
    gotoExplorer () {
      let url = 'https://nanocrawler.cc/explorer/account/' + this.userWallet.account
      let win = window.open(url, '_blank')
      win.focus()
    },
    gotoGitAccount () {
      let url = 'https://github.com/' + this.selectedUser
      let win = window.open(url, '_blank')
      win.focus()
    },
    selectedAUser () {
      console.log(this.selectedUser)
      if (this.allUserNames.includes(this.selectedUser)) {
        let indexOfUser = this.allUserNames.indexOf(this.selectedUser)
        this.avatarUrl = this.allUsers[indexOfUser].avatar_url
        this.userExists = true
        // from same index get the profile url from array of objects allUsers
      } else {
        this.avatarUrl = null
        this.userExists = false
      }
    },
    acceptedDialog () {
      this.$q.sessionStorage.set('showedWarningDialog', true)
      this.alertUserDialogShow = false
    },
    getBalance () {
      // console.log(this.userWallet.account)
      this.$axios.get(this.$backEnd + '/account/balance', { // AXIOS CALL
        params: {
          user_account: this.userWallet.account
        }
      }).then((response) => {
        this.accountBalances = response.data
        if (response.data) {
          this.gotAccountBalance = true
        } else {
          this.$q.notify({
            color: 'warning',
            message: 'Please restart browser, There is problem in getting your account balance.'
          })
        }
        console.log(this.accountBalances)
      }).catch((err) => {
        console.log(err)
        this.$q.notify({
          color: 'warning',
          message: err
        })
        this.gotAccountBalance = true
      })
    }
  },
  mounted () {
    if (!this.$q.sessionStorage.getItem('showedWarningDialog')) {
      this.alertUserDialogShow = true
    }
    // this.$stitchClient.auth.loginWithCredential(this.$q.sessionStorage.getItem('authCredentials')).then((authedUser) => {
    //   this.$q.loading.hide()
    //   console.log(authedUser.id)
    //   this.$q.sessionStorage.set('userAllocatedId', authedUser.id)
    //   // this.$axios.get(this.$backEnd + '/nanoWalletCreatedAndDataStitchSavedChecked', { // AXIOS CALL
    //   //   params: {
    //   //     node_id: this.$q.localStorage.getItem('userLogged')
    //   //   }
    //   // }).then((r) => {
    //   //   if () {}
    //   this.$db.collection('userInfo').find({ user_auth_id: authedUser.id }).asArray().then((docs) => {
    //     console.log(docs)
    //     this.$q.sessionStorage.set('userSecDetails', docs)
    //     // console.log('[MongoDB Stitch] Connected to Stitch')
    //     // window.location = this.$frontEnd
    //   }).catch(err => {
    //     this.$q.loading.hide()
    //     console.error(err)
    //   })
    // }).catch((err) => {
    //   this.$q.loading.hide()
    //   console.log(err)
    //   this.$q.notify({
    //     color: 'red',
    //     message: err.message,
    //     icon: 'warning'
    //   })
    // })
    if (this.$q.sessionStorage.getItem('userSecDetails').length > 0) {
      this.notLogged = false
      let userSecData = this.$q.sessionStorage.getItem('userSecDetails')
      if (Array.isArray(userSecData)) {
        this.userWallet = userSecData[0]
        this.$router.push(this.userWallet.user_name)
      } else {
        this.userWallet = userSecData
        this.$router.push(this.userWallet.user_name)
      }
    } else {
      this.notLogged = true
    }
    this.getBalance()
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
    // console.log(this.$q.sessionStorage.getItem('userSecDetails'))
    // console.log(this.$q.localStorage.getItem('userLogged'))
  }
}
</script>

<style>
</style>
