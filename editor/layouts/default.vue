<template>
  <div>
    <Nuxt/>

    <GDPRConsentPopup/>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import GDPRConsentPopup from "~/components/utilities/GDPRConsentPopup.vue";

export default Vue.extend({
  components: {GDPRConsentPopup}
});
</script>
