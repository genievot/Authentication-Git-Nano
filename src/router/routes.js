
const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      { path: ':userName', component: () => import('pages/Index.vue') }
    ]
  },
  {
    path: '/redirect',
    component: () => import('layouts/redirect.vue'),
    children: [
      { path: 'getuser', component: () => import('pages/tokenHandle.vue') },
      { path: 'confirmEmail', component: () => import('pages/confirmEmail.vue') },
      { path: 'passwordReset', component: () => import('pages/resetPassword.vue') }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
