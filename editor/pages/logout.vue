<template>
  <div/>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: 'Logout',
  head() {
    return {
      title: 'Logout - ' + this.$customSettings.productName,
      meta: [
        {charset: 'utf-8'},
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, user-scalable=no'
        },
        {
          hid: 'description',
          name: 'description',
          content: 'Logout of your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'Logout of your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Logout - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Logout - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'Logout of your ' + this.$customSettings.productName + ' account.'
        },
      ],
    };
  },
  mounted() {
    this.$store.commit('auth/logout');
    this.$router.push('/');
  }
});
</script>
