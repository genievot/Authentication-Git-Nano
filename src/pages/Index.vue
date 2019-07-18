<template>
  <q-page>
    <div v-if="no_transactions" class="row justify-center">
      <span class="q-ma-sm text-h5 text-grey-4">No transactions to show</span>
    </div>
    <q-infinite-scroll @load="onLoad" :offset="250">
      <div v-for="(transaction, index) in all_transactions" :key="index" class="caption">
        <div class="q-pa-md row">
          <q-card class="my-card">
          <q-item-section avatar align="center">
            <q-avatar>
              <img :src="transaction.sender_pic">
            </q-avatar>
          </q-item-section>
          <q-card-section v-if="transaction.sender == this.$route.params.userName">
            <div class="text-subtitle2">to {{transaction.receiver}}</div>
          </q-card-section>
          <q-card-section v-if="transaction.sender == this.$route.params.userName">
            <div class="text-h5 text-weight-light text-green">{{transaction.amount_sent}}</div>
            <div class="text-subtitle2">to {{transaction.receiver}}</div>
          </q-card-section>
          <q-card-section v-if="transaction.receiver == this.$route.params.userName">
            <div class="text-h5 text-weight-light text-red">{{transaction.amount_sent}}</div>
            <div class="text-subtitle2">from {{transaction.sender}}</div>
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
      skipTxs: 0,
      loadMoreData: true,
      sent: false,
      otherUser: null
    }
  },
  mounted () {
    this.$stitchClient.auth.loginWithCredential(new this.$anonymousCredential()).then(user => {
      this.$db.collection('publicUserInfo').find({ $or: [{ sender: this.$route.params.userName },
        { receiver: this.$route.params.userName }] }, { sort: { x: -1 }, limit: 10 }).asArray()
        .then((transactions) => {
          // console.log(transactions)
          if (transactions.length >= 1) {
            this.all_transactions.push(transactions)
            this.skipTxs += 10
            this.visible = false
            // this.allUsers = docs
          } else {
            this.no_transactions = true
            this.visible = false
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
    onLoad (index, done) {
      if (this.loadMoreData === false) {
        return
      }
      this.$stitchClient.auth.loginWithCredential(new this.$anonymousCredential()).then(user => {
        this.$db.collection('publicUserInfo').find({ $or: [{ sender: this.$route.params.userName },
          { receiver: this.$route.params.userName }] }, { sort: { x: -1 }, limit: 10, skip: this.skipTxs }).asArray()
          .then((transactions) => {
            done()
            // console.log(transactions)
            if (transactions.length >= 1) {
              this.all_transactions.push(transactions)
              this.skipTxs += 10
              this.visible = false
              console.log('"Ok"')
              done()
              // this.allUsers = docs
            } else {
              this.no_transactions = true
              this.visible = false
              this.loadMoreData = false
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
