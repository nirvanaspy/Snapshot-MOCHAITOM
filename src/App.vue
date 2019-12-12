<template>
  <div id="app">
    <router-view v-if="loginComplete"></router-view>
  </div>
</template>

<script>
  import { loginByUsername } from './api/login'
  import qs from 'qs'
  import { mapMutations } from 'vuex'
  import { setToken, setRefreshToken } from '@/utils/auth'

  export default{
    name: 'App',
    data() {
      return {
        loginComplete: false
      }
    },
    methods: {
      ...mapMutations({
        setVToken: 'SET_TOKEN',
        setVRefreshToken: 'SET_REFRESHTOKEN'
      }),
      directLogin() {
        const formData = qs.stringify({
          'username': 'admin',
          'password': 'admin',
          'grant_type': 'password',
          'scope': 'SCOPES',
          'client_id': 'OAUTH_CLIENT_ID',
          'enctype': 'OAUTH_CLIENT_ID'
        })
        loginByUsername(formData).then((response) => {
          const access_token = response.data.access_token
          const refresh_token = response.data.refresh_token
          this.setVToken(access_token)
          this.setVRefreshToken(refresh_token)
          setToken(access_token)
          setRefreshToken(refresh_token)
          this.loginComplete = true
        }).catch(() => {
          this.$notify({
            title: '失败',
            message: '对不起，登录失败！',
            type: 'error',
            duration: 2000
          })
          this.loginComplete = true
          this.$router.push({ path: '/login' })
        })
      }
    },
    created() {
      this.directLogin()
    }
  }
</script>
