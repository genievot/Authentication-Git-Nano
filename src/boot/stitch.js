// import something here
import {
  Stitch,
  RemoteMongoClient,
  UserPasswordCredential,
  AnonymousCredential,
  UserPasswordAuthProviderClient
} from 'mongodb-stitch-browser-sdk'
const stitchClient = Stitch.initializeDefaultAppClient('gitnano-swekr')
// "async" is optional
export default async ({ Vue }) => {
  // something to do
  Vue.prototype.$stitchClient = stitchClient
  Vue.prototype.$remoteMongoClient = RemoteMongoClient
  Vue.prototype.$db = stitchClient.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').db('nanoGit')
  Vue.prototype.$anonymousCredential = AnonymousCredential
  Vue.prototype.$userPasswordCredential = UserPasswordCredential
  Vue.prototype.$userPasswordAuthProviderClient = UserPasswordAuthProviderClient
}
