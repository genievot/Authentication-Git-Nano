// import something here
import {
  Stitch,
  RemoteMongoClient,
  UserPasswordCredential,
  AnonymousCredential,
  UserPasswordAuthProviderClient
} from 'mongodb-stitch-browser-sdk'
// "async" is optional
export default async ({ Vue }) => {
  // something to do
  Vue.prototype.$stitchClient = Stitch.initializeDefaultAppClient('gitnano-swekr')
  Vue.prototype.$remoteMongoClient = RemoteMongoClient
  Vue.prototype.$anonymousCredential = AnonymousCredential
  Vue.prototype.$userPasswordCredential = UserPasswordCredential
  Vue.prototype.$userPasswordAuthProviderClient = UserPasswordAuthProviderClient
}
