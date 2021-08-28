<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-between w-full py-12">
      <div class="flex flex-col items-start justify-start space-y-1 flex-grow flex-shrink">
        <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
          Referrals
        </h1>
        <p class="font-semibold opacity-60 text-black">Do you love {{ $customSettings.productName }}? Tell your friends
          and get paid! Earn $10
          for each pro membership you refer when your friends sign up with your link!</p>
      </div>
      <div class="flex flex-col jutify-center items-center text-center rounded-2xl ml-8" style="min-width:350px;">
        <div
          class="flex cursor-pointer flex-row items-center justify-center bg-opaqueIndigo font-bold px-4 py-2 text-center rounded-full w-full mt-2 text-gdp max-w-md border-2 border-gdp"
          title="Click to copy!"
          type="text"
          @click="copyUrl"
        >https://singlel.ink/s/{{ user.activeProfile.handle }}
        </div>
        <p class="uppercase text-sm font-extrabold leading-relaxed text-black mt-2 opacity-70">Click the url above to
          copy</p>
      </div>
    </div>
    <div class="flex flex-col pt-4 bg-white shadow items-center text-center rounded-2xl mb-8 w-full">
      <h2 class="font-bold text-black text-2xl w-full mb-4">
        Your referrals to date
      </h2>
      <div class="grid grid-cols-2 border border-l-0 border-r-0 border-b-0 border-gray-200 w-full">
        <div class="flex flex-col items-center justify-center p-6">
          <h2 class="font-bold text-black opacity-70 text-lg w-full mb-1">
            Total referrals
          </h2>
          <h4 class="text-blue-600 text-4xl leading-tight font-bold">
            198
          </h4>
        </div>
        <div
          class="flex flex-col items-center justify-center p-6 border border-gray-200 border-r-0 border-t-0 border-b-0"
        >
          <h2 class="font-bold text-black opacity-70 text-lg w-full mb-1">
            Total credit earned
          </h2>
          <h4 class="text-blue-600 text-4xl leading-tight font-bold">
            $288
          </h4>
        </div>
      </div>
      <div class="flex flex-col w-full">
        <div
          v-for="referral in referrals"
          :key="referral.email"
          class="flex flex-row py-2 px-8 cursor-pointer w-full items-center justify-start hover:bg-opaqueBlack border border-gray-200 border-b-0 border-l-0 border-r-0"
        >
          <div
            class="w-12 h-12 rounded-full mr-6"
            style="background:linear-gradient(146deg, rgba(0,255,240,1) 00%, rgba(173,255,0,1) 100%);box-shadow: inset 0 0 0 4px rgba(0,0,0,.15);"
          />
          <p class="font-bold text-black text-lg">
            {{ referral.email }}
          </p>
          <p class="font-bold mr-4 opacity-70 ml-auto">
            Sent {{ referral.sent }} ago
          </p>
          <div
            v-if="referral.status === 'pending'"
            class="py-1 px-2 mb-1 rounded-full text-gray-600 bg-opaqueBlack text-sm font-extrabold leading-tight cursor-pointer grow"
          >pending
          </div>
          <div
            v-if="referral.status === 'accepted'"
            class="py-1 px-2 mb-1 rounded-full text-green-500 bg-green-200 text-sm font-extrabold leading-tight cursor-pointer grow"
          >accepted!
          </div>
          <div
            v-if="referral.status === 'upgraded'"
            class="py-1 px-2 mb-1 rounded-full flex-row flex items-center text-gdp bg-opaqueIndigo text-sm font-extrabold leading-tight cursor-pointer grow"
          ><img class="w-4 mr-1" src="/icons/Star.svg">upgraded!
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: 'DashboardReferrals',
  layout: 'dashboard',
  middleware: 'authenticated',

  data() {
    return {
      originalHandle: '',
      user: {
        name: '',
        emailHash: '',
        activeProfile: {
          imageUrl: '',
          headline: '',
          subtitle: '',
          handle: '',
          customDomain: '',
          visibility: '',
          showWatermark: false,
          metadata: {
            privacyMode: false
          },
        }
      },
      referrals: [
        {
          email: 'jane@gmail.com',
          sent: '4 days',
          status: 'pending'
        },
        {
          email: 'joe@gmail.com',
          sent: '6 days',
          status: 'accepted'
        },
        {
          email: 'greg@gmail.com',
          sent: '7 days',
          status: 'accepted'
        },
        {
          email: 'phil@gmail.com',
          sent: '9 days',
          status: 'pending'
        },
        {
          email: 'drew@gmail.com',
          sent: '11 days',
          status: 'upgraded'
        },
      ]
    };
  },

  mounted() {
    this.getUserData();
  },

  methods: {
    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const userResponse = await this.$axios.$post('/user', {
          token
        });

        const siteResponse = await this.$axios.$post('/profile/active-profile', {
          token
        });

        this.user.name = userResponse.name;
        this.user.emailHash = userResponse.emailHash;

        this.user.activeProfile.imageUrl = siteResponse.imageUrl;
        this.user.activeProfile.headline = siteResponse.headline;
        this.user.activeProfile.subtitle = siteResponse.subtitle;
        this.user.activeProfile.handle = siteResponse.handle;
        this.user.activeProfile.customDomain = siteResponse.customDomain;
        this.user.activeProfile.visibility = siteResponse.visibility;
        this.user.activeProfile.showWatermark = siteResponse.showWatermark;

        this.user.activeProfile.metadata.privacyMode = siteResponse.metadata.privacyMode;

        this.$set(this.user.activeProfile, 'user.activeProfile', siteResponse);

        this.originalHandle = this.user.activeProfile.handle;
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    copyUrl() {
      try {
        const text = 'https://singlel.ink/s/' + this.user.activeProfile.handle;
        const url = new URL(text);

        navigator.clipboard.writeText(url.toString());
        alert('Url copied to clipboard!');
      } catch (error) {
        console.log(error);
        const text = 'https://singlel.ink/s/' + this.user.activeProfile.handle;

        prompt('Copy this url to the clipboard: Ctrl+C, Enter\n', text);
      }
    },
  }
});
</script>
