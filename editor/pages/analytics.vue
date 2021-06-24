<template>
  <div/>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  head() {
    return {
      title: 'Analytics - ' + process.env.APP_NAME,
      meta: [
        {
          hid: 'robots',
          name: 'robots',
          content: 'noindex'
        }
      ]
    };
  },
  mounted() {
    location.href = 'https://singlelink.co/analytics';
  }
});
</script>
