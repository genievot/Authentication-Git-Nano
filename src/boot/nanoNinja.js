// import something here
const NanoClient = require('nano-node-rpc')
// "async" is optional
export default async ({ Vue }) => {
  let key = process.env.NINJA_API_KEY
  Vue.prototype.$nanoClient = new NanoClient({ apiKey: key })
  // console.log(process.env.NINJA_API_KEY)
}
