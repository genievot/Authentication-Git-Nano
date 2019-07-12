// import something here

// "async" is optional
export default async ({ Vue }) => {
  // something to do
  Vue.prototype.$frontEnd = 'http://localhost:8080'
  Vue.prototype.$backEnd = 'http://localhost:3000'
}
