<template>
  <q-page>
    <div v-if="no_transactions" class="row justify-center">
      <span class="q-ma-sm text-h5 text-grey-4">No transactions to show</span>
    </div>
    <q-infinite-scroll @load="onLoad" :offset="250" align="center">
      <div v-for="(transaction, index) in all_transactions" :key="index" class="caption">
        <div class="q-pa-md row justify-center q-ma-md">
          <q-card class="my-card" style="max-width: 90vw; width: 500px">
          <q-item-section avatar align="center">
            <q-avatar square>
              <img :src="transaction.sender_pic">
            </q-avatar>
          </q-item-section>
          <q-card-section v-if="transaction.sender == thisUserName">
            <div class="text-h5 text-weight-light text-red">- {{transaction.amount_sent}}</div>
            <div class="text-subtitle2">to <q-item-label class="text-weight-light" lines='1' v-if="transaction.receiver_name">{{transaction.receiver_name}}</q-item-label></div>
            <div class="text-subtitle2"><q-item-label class="text-weight-light" lines='1' v-if="transaction.receiver">{{transaction.receiver}}</q-item-label></div>
            <q-btn class="text-red bg-white q-mt-md" @click="gotoExplorer(transaction.process_result.hash)" round icon="launch" />
          </q-card-section>
          <q-card-section v-if="transaction.receiver_name == thisUserName">
            <div class="text-h5 text-weight-light text-green">+ {{transaction.amount_sent}}</div>
            <div class="text-subtitle2">from <q-item-label class="text-weight-light" lines='1'> {{transaction.sender}} </q-item-label></div>
            <q-btn class="text-green bg-white q-mt-md" @click="gotoExplorer(transaction.process_result.hash)" round icon="launch" />
          </q-card-section>
          </q-card>
        </div>
      </div>
      <template v-if="loadMoreData" v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="grey-6" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
    <q-inner-loading :showing="visible">
      <q-circular-progress
        indeterminate
        size="45px"
        :thickness="1"
        color="grey-8"
        track-color="white"
        class="q-ma-md"
      />
  </q-inner-loading>
  </q-page>
</template>

<style>
</style>

<script>
export default {
  name: 'PageIndex',
  data () {
    return {
      all_transactions: [],
      no_transactions: false,
      visible: true,
      skipTxs: 10,
      loadMoreData: true,
      sent: false,
      otherUser: null,
      thisUserName: null
    }
  },
  mounted () {
    this.thisUserName = this.$route.params.userName
    this.$stitchClient.auth.loginWithCredential(new this.$anonymousCredential()).then(user => {
      this.$db.collection('globalTxs').find({ $or: [{ sender: this.thisUserName },
        { receiver_name: this.thisUserName }] }, { sort: { x: -1 }, limit: 5 }).asArray()
        .then((transactions) => {
          // console.log(transactions)
          if (transactions.length >= 1) {
            this.all_transactions = transactions
            this.visible = false
            // this.allUsers = docs
          } else {
            this.no_transactions = true
            this.visible = false
            this.loadMoreData = false
          }
        // window.location = this.$frontEnd
        }).catch(err => {
          this.$q.loading.hide()
          console.error(err)
        })
    })
    // console.log(this.$q.sessionStorage.getAll())
    // console.log(this.$q.localStorage.getItem('userLogged'))
    // console.log(this.$q.sessionStorage.getItem('userSecDetails'))
  },
  methods: {
    gotoExplorer (hash) {
      let url = 'https://nanocrawler.cc/explorer/block/' + hash
      let win = window.open(url, '_blank')
      win.focus()
    },
    onLoad (index, done) {
      if (this.loadMoreData === false) {
        return
      }
      this.userName = this.$route.params.userName
      this.$stitchClient.auth.loginWithCredential(new this.$anonymousCredential()).then(user => {
        this.$db.collection('globalTxs').find({ $or: [{ sender: this.userName },
          { receiver_name: this.userName }] }, { sort: { x: -1 }, limit: 5, skip: this.skipTxs }).asArray()
          .then((transactions) => {
            // console.log(transactions)
            if (transactions.length >= 1) {
              for (let index = 0; index < transactions.length; index++) {
                this.all_transactions.push(transactions[index])
              }
              this.skipTxs += 10
              this.visible = false
              console.log('"Ok"')
              done()
              this.loadMoreData = false
              // this.allUsers = docs
            } else {
              // this.no_transactions = true
              this.loadMoreData = false
              this.visible = false
              done(true)
            }
          // window.location = this.$frontEnd
          }).catch(err => {
            this.$q.loading.hide()
            console.error(err)
            done(true)
          })
      })
    }
  }
}
</script>
