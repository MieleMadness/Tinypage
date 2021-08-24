<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img class="w-8" src="/Settings.svg" alt="settings svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Account settings
      </h1>
    </div>

    <!-- Alerts-->
    <div
      v-show="alerts.successUpdateSub"
      class="flex flex-col lg:flex-row justify-center items-center p-3 rounded-2xl bg-green-300 shadow w-full mb-8"
    >
      <p class="text-black opacity-70 font-semibold">
        Successfully {{ billing.cardNumber ? "saved" : "cleared" }} updated subscription!
      </p>
    </div>

    <div
      v-show="alerts.failedUpdateSub"
      class="flex flex-col lg:flex-row justify-center items-center p-3 rounded-2xl bg-red-300 shadow w-full mb-8"
    >
      <p class="text-black opacity-70 font-semibold">
        Failed to change subscription. Please contact support if this keeps happening.
      </p>
    </div>

    <div
      v-show="alerts.successSaveInfo"
      class="flex flex-col lg:flex-row justify-center items-center p-3 rounded-2xl bg-green-300 shadow w-full mb-8"
    >
      <p class="text-black opacity-70 font-semibold">
        Successfully saved billing information!
      </p>
    </div>

    <div
      v-show="alerts.failedSaveInfo"
      class="flex flex-col lg:flex-row justify-center items-center p-3 rounded-2xl bg-red-300 shadow w-full mb-8"
    >
      <p class="text-black opacity-70 font-semibold">
        Failed to save billing information. Make sure all the required fields are filled out!
      </p>
    </div>

    <!--    <div-->
    <!--      v-if="subInfo || (savedCard && savedCard.last4)"-->
    <!--      class="p-3 rounded-2xl bg-white shadow w-full mb-8"-->
    <!--    >-->
    <!--      <h2 v-show="subInfo" class="text-black font-bold text-lg w-full">-->
    <!--        Subscription Info-->
    <!--      </h2>-->
    <!--      &lt;!&ndash; Subscription Info &ndash;&gt;-->
    <!--      <div-->
    <!--        v-if="subInfo"-->
    <!--        class="justify-center items-center p-3 rounded-2xl shadow w-full mb-8"-->
    <!--      >-->
    <!--        {{ subInfo }}-->
    <!--      </div>-->

    <!--      <h2 v-show="(savedCard && savedCard.last4)" class="text-black font-bold text-lg w-full">-->
    <!--        Card Info-->
    <!--      </h2>-->
    <!--      &lt;!&ndash; Card Info &ndash;&gt;-->
    <!--      <div-->
    <!--        v-if="savedCard && savedCard.last4"-->
    <!--        class="justify-center items-center p-3 rounded-2xl shadow w-full mb-8"-->
    <!--      >-->
    <!--        <p class="text-black opacity-70 font-semibold">-->
    <!--          Card Info <br>-->
    <!--          Name: {{ savedCard.name }}<br>-->
    <!--          Exp: {{ savedCard.expDate }}<br>-->
    <!--          Last4: *{{ savedCard.last4 }}<br>-->
    <!--        </p>-->
    <!--      </div>-->
    <!--      <div v-else>-->
    <!--        No card saved-->
    <!--      </div>-->
    <!--    </div>-->

    <!-- Select billing tier -->
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full">
        Select billing tier
      </h2>
      <p class="text-black font-bold opacity-70 max-w-xl">
        Want to change your billing tier? Use the dropdown below.
      </p>
      <div class="flex flex-col mt-4 mb-2 w-full">
        <label class="font-bold opacity-70 text-black mb-3" for="tierSelect">Account tier</label>
        <div class="flex flex-col lg:flex-row items-center justify-start space-y-4 lg:space-y-0 lg:space-x-4 w-full">
          <select
            id="tierSelect"
            v-model="selectedBillingTier"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl font-bold border w-full lg:w-auto flex-grow lg:max-w-md"
          >
            <option value="free">
              Forever free - $0/Month
            </option>
            <option value="pro">
              Pro - $8/Month
            </option>
            <option value="team">
              Team - $8/Seat - minimum 3 seats @ $25/mo
            </option>
            <option value="enterprise">
              Enterprise - Contact sales
            </option>
          </select>
          <button
            type="button"
            class="w-full lg:w-auto flex py-3 px-6 text-sm text-white text-center bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold justify-center align-center"
            @click="setBillingModalActive(true)"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>

    <!-- Billing information -->
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start mb-8">
      <h2 class="text-black font-bold text-lg w-full">
        Billing information
      </h2>
      <p class="text-black font-bold opacity-70 max-w-xl">
        Entering your billing information is required to upgrade your account to a paid tier.
      </p>
      <div class="w-full flex flex-col lg:flex-row grid grid-cols-3 gap-4">
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">Full name*</label>
          <input
            v-model="billing.fullName"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: Jane Doe"
          >
        </div>
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">Company name</label>
          <input
            v-model="billing.companyName"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            :placeholder="`ex: ${$customSettings.company}`"
          >
        </div>
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">Phone number</label>
          <input
            v-model="billing.phone"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: (919) 653-0790"
          >
        </div>
      </div>
      <div class="w-full flex flex-col lg:flex-row grid grid-cols-5 gap-4">
        <div class="flex flex-col mt-4 mb-2 w-full col-span-2">
          <label class="font-bold text-black opacity-70 mb-3">Address*</label>
          <input
            v-model="billing.address"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: 120 Preston Executive Dr."
          >
        </div>
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">City*</label>
          <input
            v-model="billing.city"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: Cary"
          >
        </div>
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">Zip code*</label>
          <input
            v-model="billing.zipCode"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: 27519"
          >
        </div>
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">Country*</label>
          <select
            v-model="billing.country"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
          >
            <option>Select one...</option>
            <option value="Afganistan">
              Afghanistan
            </option>
            <option value="Albania">
              Albania
            </option>
            <option value="Algeria">
              Algeria
            </option>
            <option value="American Samoa">
              American Samoa
            </option>
            <option value="Andorra">
              Andorra
            </option>
            <option value="Angola">
              Angola
            </option>
            <option value="Anguilla">
              Anguilla
            </option>
            <option value="Antigua & Barbuda">
              Antigua & Barbuda
            </option>
            <option value="Argentina">
              Argentina
            </option>
            <option value="Armenia">
              Armenia
            </option>
            <option value="Aruba">
              Aruba
            </option>
            <option value="Australia">
              Australia
            </option>
            <option value="Austria">
              Austria
            </option>
            <option value="Azerbaijan">
              Azerbaijan
            </option>
            <option value="Bahamas">
              Bahamas
            </option>
            <option value="Bahrain">
              Bahrain
            </option>
            <option value="Bangladesh">
              Bangladesh
            </option>
            <option value="Barbados">
              Barbados
            </option>
            <option value="Belarus">
              Belarus
            </option>
            <option value="Belgium">
              Belgium
            </option>
            <option value="Belize">
              Belize
            </option>
            <option value="Benin">
              Benin
            </option>
            <option value="Bermuda">
              Bermuda
            </option>
            <option value="Bhutan">
              Bhutan
            </option>
            <option value="Bolivia">
              Bolivia
            </option>
            <option value="Bonaire">
              Bonaire
            </option>
            <option value="Bosnia & Herzegovina">
              Bosnia & Herzegovina
            </option>
            <option value="Botswana">
              Botswana
            </option>
            <option value="Brazil">
              Brazil
            </option>
            <option value="British Indian Ocean Ter">
              British Indian Ocean Ter
            </option>
            <option value="Brunei">
              Brunei
            </option>
            <option value="Bulgaria">
              Bulgaria
            </option>
            <option value="Burkina Faso">
              Burkina Faso
            </option>
            <option value="Burundi">
              Burundi
            </option>
            <option value="Cambodia">
              Cambodia
            </option>
            <option value="Cameroon">
              Cameroon
            </option>
            <option value="Canada">
              Canada
            </option>
            <option value="Canary Islands">
              Canary Islands
            </option>
            <option value="Cape Verde">
              Cape Verde
            </option>
            <option value="Cayman Islands">
              Cayman Islands
            </option>
            <option value="Central African Republic">
              Central African Republic
            </option>
            <option value="Chad">
              Chad
            </option>
            <option value="Channel Islands">
              Channel Islands
            </option>
            <option value="Chile">
              Chile
            </option>
            <option value="China">
              China
            </option>
            <option value="Christmas Island">
              Christmas Island
            </option>
            <option value="Cocos Island">
              Cocos Island
            </option>
            <option value="Colombia">
              Colombia
            </option>
            <option value="Comoros">
              Comoros
            </option>
            <option value="Congo">
              Congo
            </option>
            <option value="Cook Islands">
              Cook Islands
            </option>
            <option value="Costa Rica">
              Costa Rica
            </option>
            <option value="Cote DIvoire">
              Cote DIvoire
            </option>
            <option value="Croatia">
              Croatia
            </option>
            <option value="Cuba">
              Cuba
            </option>
            <option value="Curaco">
              Curacao
            </option>
            <option value="Cyprus">
              Cyprus
            </option>
            <option value="Czech Republic">
              Czech Republic
            </option>
            <option value="Denmark">
              Denmark
            </option>
            <option value="Djibouti">
              Djibouti
            </option>
            <option value="Dominica">
              Dominica
            </option>
            <option value="Dominican Republic">
              Dominican Republic
            </option>
            <option value="East Timor">
              East Timor
            </option>
            <option value="Ecuador">
              Ecuador
            </option>
            <option value="Egypt">
              Egypt
            </option>
            <option value="El Salvador">
              El Salvador
            </option>
            <option value="Equatorial Guinea">
              Equatorial Guinea
            </option>
            <option value="Eritrea">
              Eritrea
            </option>
            <option value="Estonia">
              Estonia
            </option>
            <option value="Ethiopia">
              Ethiopia
            </option>
            <option value="Falkland Islands">
              Falkland Islands
            </option>
            <option value="Faroe Islands">
              Faroe Islands
            </option>
            <option value="Fiji">
              Fiji
            </option>
            <option value="Finland">
              Finland
            </option>
            <option value="France">
              France
            </option>
            <option value="French Guiana">
              French Guiana
            </option>
            <option value="French Polynesia">
              French Polynesia
            </option>
            <option value="French Southern Ter">
              French Southern Ter
            </option>
            <option value="Gabon">
              Gabon
            </option>
            <option value="Gambia">
              Gambia
            </option>
            <option value="Georgia">
              Georgia
            </option>
            <option value="Germany">
              Germany
            </option>
            <option value="Ghana">
              Ghana
            </option>
            <option value="Gibraltar">
              Gibraltar
            </option>
            <option value="Great Britain">
              Great Britain
            </option>
            <option value="Greece">
              Greece
            </option>
            <option value="Greenland">
              Greenland
            </option>
            <option value="Grenada">
              Grenada
            </option>
            <option value="Guadeloupe">
              Guadeloupe
            </option>
            <option value="Guam">
              Guam
            </option>
            <option value="Guatemala">
              Guatemala
            </option>
            <option value="Guinea">
              Guinea
            </option>
            <option value="Guyana">
              Guyana
            </option>
            <option value="Haiti">
              Haiti
            </option>
            <option value="Hawaii">
              Hawaii
            </option>
            <option value="Honduras">
              Honduras
            </option>
            <option value="Hong Kong">
              Hong Kong
            </option>
            <option value="Hungary">
              Hungary
            </option>
            <option value="Iceland">
              Iceland
            </option>
            <option value="Indonesia">
              Indonesia
            </option>
            <option value="India">
              India
            </option>
            <option value="Iran">
              Iran
            </option>
            <option value="Iraq">
              Iraq
            </option>
            <option value="Ireland">
              Ireland
            </option>
            <option value="Isle of Man">
              Isle of Man
            </option>
            <option value="Israel">
              Israel
            </option>
            <option value="Italy">
              Italy
            </option>
            <option value="Jamaica">
              Jamaica
            </option>
            <option value="Japan">
              Japan
            </option>
            <option value="Jordan">
              Jordan
            </option>
            <option value="Kazakhstan">
              Kazakhstan
            </option>
            <option value="Kenya">
              Kenya
            </option>
            <option value="Kiribati">
              Kiribati
            </option>
            <option value="Korea North">
              Korea North
            </option>
            <option value="Korea Sout">
              Korea South
            </option>
            <option value="Kuwait">
              Kuwait
            </option>
            <option value="Kyrgyzstan">
              Kyrgyzstan
            </option>
            <option value="Laos">
              Laos
            </option>
            <option value="Latvia">
              Latvia
            </option>
            <option value="Lebanon">
              Lebanon
            </option>
            <option value="Lesotho">
              Lesotho
            </option>
            <option value="Liberia">
              Liberia
            </option>
            <option value="Libya">
              Libya
            </option>
            <option value="Liechtenstein">
              Liechtenstein
            </option>
            <option value="Lithuania">
              Lithuania
            </option>
            <option value="Luxembourg">
              Luxembourg
            </option>
            <option value="Macau">
              Macau
            </option>
            <option value="Macedonia">
              Macedonia
            </option>
            <option value="Madagascar">
              Madagascar
            </option>
            <option value="Malaysia">
              Malaysia
            </option>
            <option value="Malawi">
              Malawi
            </option>
            <option value="Maldives">
              Maldives
            </option>
            <option value="Mali">
              Mali
            </option>
            <option value="Malta">
              Malta
            </option>
            <option value="Marshall Islands">
              Marshall Islands
            </option>
            <option value="Martinique">
              Martinique
            </option>
            <option value="Mauritania">
              Mauritania
            </option>
            <option value="Mauritius">
              Mauritius
            </option>
            <option value="Mayotte">
              Mayotte
            </option>
            <option value="Mexico">
              Mexico
            </option>
            <option value="Midway Islands">
              Midway Islands
            </option>
            <option value="Moldova">
              Moldova
            </option>
            <option value="Monaco">
              Monaco
            </option>
            <option value="Mongolia">
              Mongolia
            </option>
            <option value="Montserrat">
              Montserrat
            </option>
            <option value="Morocco">
              Morocco
            </option>
            <option value="Mozambique">
              Mozambique
            </option>
            <option value="Myanmar">
              Myanmar
            </option>
            <option value="Nambia">
              Nambia
            </option>
            <option value="Nauru">
              Nauru
            </option>
            <option value="Nepal">
              Nepal
            </option>
            <option value="Netherland Antilles">
              Netherland Antilles
            </option>
            <option value="Netherlands">
              Netherlands (Holland, Europe)
            </option>
            <option value="Nevis">
              Nevis
            </option>
            <option value="New Caledonia">
              New Caledonia
            </option>
            <option value="New Zealand">
              New Zealand
            </option>
            <option value="Nicaragua">
              Nicaragua
            </option>
            <option value="Niger">
              Niger
            </option>
            <option value="Nigeria">
              Nigeria
            </option>
            <option value="Niue">
              Niue
            </option>
            <option value="Norfolk Island">
              Norfolk Island
            </option>
            <option value="Norway">
              Norway
            </option>
            <option value="Oman">
              Oman
            </option>
            <option value="Pakistan">
              Pakistan
            </option>
            <option value="Palau Island">
              Palau Island
            </option>
            <option value="Palestine">
              Palestine
            </option>
            <option value="Panama">
              Panama
            </option>
            <option value="Papua New Guinea">
              Papua New Guinea
            </option>
            <option value="Paraguay">
              Paraguay
            </option>
            <option value="Peru">
              Peru
            </option>
            <option value="Phillipines">
              Philippines
            </option>
            <option value="Pitcairn Island">
              Pitcairn Island
            </option>
            <option value="Poland">
              Poland
            </option>
            <option value="Portugal">
              Portugal
            </option>
            <option value="Puerto Rico">
              Puerto Rico
            </option>
            <option value="Qatar">
              Qatar
            </option>
            <option value="Republic of Montenegro">
              Republic of Montenegro
            </option>
            <option value="Republic of Serbia">
              Republic of Serbia
            </option>
            <option value="Reunion">
              Reunion
            </option>
            <option value="Romania">
              Romania
            </option>
            <option value="Russia">
              Russia
            </option>
            <option value="Rwanda">
              Rwanda
            </option>
            <option value="St Barthelemy">
              St Barthelemy
            </option>
            <option value="St Eustatius">
              St Eustatius
            </option>
            <option value="St Helena">
              St Helena
            </option>
            <option value="St Kitts-Nevis">
              St Kitts-Nevis
            </option>
            <option value="St Lucia">
              St Lucia
            </option>
            <option value="St Maarten">
              St Maarten
            </option>
            <option value="St Pierre & Miquelon">
              St Pierre & Miquelon
            </option>
            <option value="St Vincent & Grenadines">
              St Vincent & Grenadines
            </option>
            <option value="Saipan">
              Saipan
            </option>
            <option value="Samoa">
              Samoa
            </option>
            <option value="Samoa American">
              Samoa American
            </option>
            <option value="San Marino">
              San Marino
            </option>
            <option value="Sao Tome & Principe">
              Sao Tome & Principe
            </option>
            <option value="Saudi Arabia">
              Saudi Arabia
            </option>
            <option value="Senegal">
              Senegal
            </option>
            <option value="Seychelles">
              Seychelles
            </option>
            <option value="Sierra Leone">
              Sierra Leone
            </option>
            <option value="Singapore">
              Singapore
            </option>
            <option value="Slovakia">
              Slovakia
            </option>
            <option value="Slovenia">
              Slovenia
            </option>
            <option value="Solomon Islands">
              Solomon Islands
            </option>
            <option value="Somalia">
              Somalia
            </option>
            <option value="South Africa">
              South Africa
            </option>
            <option value="Spain">
              Spain
            </option>
            <option value="Sri Lanka">
              Sri Lanka
            </option>
            <option value="Sudan">
              Sudan
            </option>
            <option value="Suriname">
              Suriname
            </option>
            <option value="Swaziland">
              Swaziland
            </option>
            <option value="Sweden">
              Sweden
            </option>
            <option value="Switzerland">
              Switzerland
            </option>
            <option value="Syria">
              Syria
            </option>
            <option value="Tahiti">
              Tahiti
            </option>
            <option value="Taiwan">
              Taiwan
            </option>
            <option value="Tajikistan">
              Tajikistan
            </option>
            <option value="Tanzania">
              Tanzania
            </option>
            <option value="Thailand">
              Thailand
            </option>
            <option value="Togo">
              Togo
            </option>
            <option value="Tokelau">
              Tokelau
            </option>
            <option value="Tonga">
              Tonga
            </option>
            <option value="Trinidad & Tobago">
              Trinidad & Tobago
            </option>
            <option value="Tunisia">
              Tunisia
            </option>
            <option value="Turkey">
              Turkey
            </option>
            <option value="Turkmenistan">
              Turkmenistan
            </option>
            <option value="Turks & Caicos Is">
              Turks & Caicos Is
            </option>
            <option value="Tuvalu">
              Tuvalu
            </option>
            <option value="Uganda">
              Uganda
            </option>
            <option value="United Kingdom">
              United Kingdom
            </option>
            <option value="Ukraine">
              Ukraine
            </option>
            <option value="United Arab Erimates">
              United Arab Emirates
            </option>
            <option value="United States of America">
              United States of America
            </option>
            <option value="Uraguay">
              Uruguay
            </option>
            <option value="Uzbekistan">
              Uzbekistan
            </option>
            <option value="Vanuatu">
              Vanuatu
            </option>
            <option value="Vatican City State">
              Vatican City State
            </option>
            <option value="Venezuela">
              Venezuela
            </option>
            <option value="Vietnam">
              Vietnam
            </option>
            <option value="Virgin Islands (Brit)">
              Virgin Islands (Brit)
            </option>
            <option value="Virgin Islands (USA)">
              Virgin Islands (USA)
            </option>
            <option value="Wake Island">
              Wake Island
            </option>
            <option value="Wallis & Futana Is">
              Wallis & Futana Is
            </option>
            <option value="Yemen">
              Yemen
            </option>
            <option value="Zaire">
              Zaire
            </option>
            <option value="Zambia">
              Zambia
            </option>
            <option value="Zimbabwe">
              Zimbabwe
            </option>
          </select>
        </div>
      </div>
      <button
        type="button"
        class="mt-4 py-3 px-6 text-center text-base text-white bg-gdp hover:bg-indigo-500 rounded-2xl font-bold"
        @click="saveBillingInfo()"
      >
        Save changes
      </button>
    </div>

    <!-- Card information -->
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full">
        Card information
      </h2>
      <p class="text-black font-bold opacity-70 max-w-xl">
        Update your card information below. Leave blank to remove a saved card.
      </p>
      <div class="w-full flex flex-col lg:flex-row grid grid-cols-3 gap-4">
        <div class="flex flex-col mt-4 mb-2 w-full col-span-2">
          <label class="font-bold text-black opacity-70 mb-3">Card number*</label>
          <input
            v-model="card.number"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: 4242 4242 4242"
          >
        </div>
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">Expiration date*</label>
          <input
            v-model="card.expDate"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: 10/25"
          >
        </div>
        <div class="flex flex-col mt-4 mb-2 w-full">
          <label class="font-bold text-black opacity-70 mb-3">Security code*</label>
          <input
            v-model="card.securityCode"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full lg:w-auto flex-grow"
            type="text"
            placeholder="ex: 320"
          >
        </div>
      </div>
      <button
        type="button"
        class="mt-4 py-3 px-6 text-center text-base text-white bg-gdp hover:bg-indigo-500 rounded-2xl font-bold"
        @click="saveCardInfo()"
      >
        Save changes
      </button>
    </div>

    <!-- Team/seats controls -->
    <div class="flex flex-col py-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full px-6 mb-6">
        Manage your team
      </h2>
      <div class="w-full bg-gray-200" style="height:1px;"/>
      <div
        v-for="member in teamMembers"
        :key="member.email"
        class="flex flex-row py-2 px-8 cursor-pointer w-full items-center justify-start hover:bg-opaqueBlack border border-gray-200 border-t-0 border-l-0 border-r-0"
      >
        <div
          class="w-12 h-12 rounded-full mr-6"
          style="background:linear-gradient(146deg, rgba(0,255,240,1) 00%, rgba(173,255,0,1) 100%);box-shadow: inset 0 0 0 4px rgba(0,0,0,.15);"
        />
        <p class="font-bold text-black text-lg mr-auto">
          {{ member.email }}
        </p>
        <div
          v-if="member.status === 'pending'"
          class="py-1 px-2 mb-1 rounded-full text-gray-600 bg-opaqueBlack text-sm font-extrabold leading-tight cursor-pointer grow"
        >pending
        </div>
        <div
          v-if="member.status === 'accepted'"
          class="py-1 px-2 mb-1 rounded-full text-green-500 bg-green-200 text-sm font-extrabold leading-tight cursor-pointer grow"
        >member
        </div>
        <div
          v-if="member.status === 'upgraded'"
          class="py-1 px-2 mb-1 rounded-full flex-row flex items-center text-gdp bg-opaqueIndigo text-sm font-extrabold leading-tight cursor-pointer grow"
        >admin
        </div>
      </div>
      <div class="flex flex-col mt-4 mb-2 w-full px-6 mt-6">
        <label v-if="!teamMembers || teamMembers.length <=1" class="font-bold text-black opacity-70 mb-3">Ready to add
          your first team
          member? Provide an email to send the invite!</label>
        <label v-else class="font-bold text-black opacity-70 mb-3">Want to add a new member? Provide an email to send
          the invite!</label>
        <div class="flex flex-col items-center justify-start space-y-4 w-full">
          <input
            id="sendInvite"
            v-model="teamMemberEmail"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"
            type="text"
            placeholder="e.g. jane@gmail.com"
            aria-label="password reset email"
          >
          <button
            type="button"
            class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-indigo-500 rounded-2xl font-bold justify-center align-center"
            @click="setPasswordModalActive(true)"
          >
            Send invitation email and add seat (+$8/mo)
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Email Address -->
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full">
        Update your email address
      </h2>
      <p class="text-black font-bold opacity-70">
        An email will be sent to you with a confirmation link. Please type your new email in the form below to coninue.
      </p>
      <div class="flex flex-col mt-4 mb-2 w-full">
        <label class="font-bold text-black opacity-70 mb-3">New email address</label>
        <div class="flex flex-col items-center justify-start space-y-4 w-full">
          <input
            id="resetEmail"
            v-model="resetNewEmail"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"
            type="text"
            placeholder="e.g. jane@gmail.com"
            aria-label="password reset email"
          >
          <button
            type="button"
            class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-indigo-500 rounded-2xl font-bold justify-center align-center"
            @click="setPasswordModalActive(true)"
          >
            Send email change confirmation email
          </button>
        </div>
      </div>
    </div>

    <!-- Request GDPR package-->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Request GDPR Package
        </h2>
        <p class="text-black font-bold opacity-70">Download a data package containing all of your recorded data.</p>
      </div>
      <button
        type="button"
        class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex px-6 py-3 text-sm text-white text-center bg-green-600 hover:bg-green-400 rounded-2xl font-bold w-1/3 justify-center align-center"
        @click="downloadGDPRPackage"
      >
        Download
      </button>
    </div>

    <!-- Reset Password -->
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full">
        Reset your password
      </h2>
      <p class="text-black font-bold opacity-70 max-w-xl">
        An email will be sent to you with a password reset link. Please type in the same email you used to sign up
        for this account to confirm.
      </p>
      <div class="flex flex-col mt-4 mb-2 w-full">
        <label class="font-bold text-black opacity-70 mb-3">Confirm your email address</label>
        <div class="flex flex-col items-center justify-start space-y-4 w-full">
          <input
            id="passwordResetEmail"
            v-model="passwordEmail"
            class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"
            type="text"
            placeholder="e.g. jane@gmail.com"
            aria-label="password reset email"
          >
          <button
            type="button"
            class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-indigo-500 rounded-2xl font-bold justify-center align-center"
            @click="setPasswordModalActive(true)">
            Request password reset link
          </button>
        </div>
      </div>
    </div>

    <!-- Delete account -->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Delete this account
        </h2>
        <p class="text-black font-bold opacity-70">Done with this account? Click the button on your right to delete
          this
          profile and all related content.</p>
      </div>
      <button
        type="button"
        class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex px-6 py-3 text-sm text-white text-center bg-red-600 hover:bg-red-400 rounded-2xl font-bold w-1/3 justify-center align-center"
        @click="setDeleteUserModalActive(true)"
      >
        Delete this account
      </button>
    </div>

    <transition name="fade">
      <!-- Billing confirmation modal -->
      <div
        v-if="billingModalActive"
        class="w-screen h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
        @click="setPasswordModalActive(false)"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-bold text-xl">
            {{ passwordError ? "Error on password request!" : "Password reset requested" }}
          </h2>
          <p v-if="!passwordError" class="text-gray-600 text-sm">A password reset link has been sent to your account
            email inbox successfully.
            Make sure to check your spam folder.</p>

          <p v-if="passwordError" class="text-gray-600 text-sm">
            <i class="fas fa-exclamation-triangle"/>
            {{ passwordError }}
          </p>
          <button
            type="button"
            class="mt-4 p-3 text-center text-md text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold"
            @click="setPasswordModalActive(false)"
          >
            Close
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <!-- Password reset confirmation modal -->
      <div
        v-if="resetPasswordModalActive"
        class="h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
        @click="setPasswordModalActive(false)"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-bold text-xl">
            {{ passwordError ? "Error on password request!" : "Password reset requested" }}
          </h2>
          <p v-if="!passwordError" class="text-gray-600 text-sm">A password reset link has been sent to your account
            email inbox successfully.
            Make sure to check your spam folder.</p>

          <p v-if="passwordError" class="text-gray-600 text-sm">
            <i class="fas fa-exclamation-triangle"/>
            {{ passwordError }}
          </p>
          <button
            type="button"
            class="mt-4 p-3 text-center text-md text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold"
            @click="setPasswordModalActive(false)"
          >
            Close
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <!-- user deletion reset modal -->
      <div
        v-if="deleteUserModalActive"
        class="h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
        @click="setDeleteUserModalActive(false)"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-bold text-xl">
            Are you sure?
          </h2>

          <p class="text-gray-600 text-sm">There is NO UNDO for this operation! All your profiles will be deleted!</p>

          <button
            type="button"
            class="mt-4 p-3 text-center text-md text-white bg-red-700 hover:bg-red-400 rounded-2xl font-bold"
            @click="deleteUser"
          >
            Delete User
          </button>

          <button
            type="button"
            class="mt-4 p-3 text-center text-md text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold"
            @click="setDeleteUserModalActive(false)"
          >
            Cancel
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <!-- Delete account confirmation modal -->
      <div
        v-if="deleteAccountModalActive"
        class="w-screen h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
        @click="setPasswordModalActive(false)"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-bold text-xl">
            {{ passwordError ? "Error on password request!" : "Password reset requested" }}
          </h2>
          <p v-if="!passwordError" class="text-gray-600 text-sm">A password reset link has been sent to your account
            email inbox successfully.
            Make sure to check your spam folder.</p>

          <p v-if="passwordError" class="text-gray-600 text-sm">
            <i class="fas fa-exclamation-triangle"/>
            {{ passwordError }}
          </p>
          <button
            type="button"
            class="mt-4 p-3 text-center text-md text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold"
            @click="setPasswordModalActive(false)"
          >
            Close
          </button>
        </div>
      </div>
    </transition>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import {StatusCodes} from "http-status-codes";

type SubInfo = {
  type: string | null | undefined,
  status: string,
  billingDisplay: string,
  amountDue: number,
  amountPaid: number,
  amountRemaining: number,
  periodEndDate: string | undefined,
  dueDate: string | undefined,
  cancelAtPeriodEnd: boolean | undefined,
  downgrading: boolean,
  downgradeDate: string | undefined,
  downgradingTier: string | undefined,
};

export default Vue.extend({
  name: 'DashboardSettings',
  layout: 'dashboard',
  middleware: 'authenticated',

  head() {
    return {
      title: 'Account settings - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Manage your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'Manage your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Account settings - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Account settings - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'Manage your ' + this.$customSettings.productName + ' account.'
        },
      ],
    };
  },

  data() {
    return {
      team: [
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
      ],

      loaded: false,
      billingModalActive: false,
      resetPasswordModalActive: false,
      deleteUserModalActive: false,
      originalHandle: '',

      user: {
        name: '',
        emailHash: '',
        email: '',
        activeProfile: {
          imageUrl: '',
          headline: '',
          subtitle: '',
          handle: '',
          customDomain: '',
          visibility: '',
          showWatermark: false,
        }
      },
      teamMembers: [],

      error: '',
      passwordError: '',
      passwordEmail: '' as string | null | undefined,
      resetNewEmail: '',
      teamMemberEmail: '',
      showWatermarkNotice: false,
      app_name: process.env.APP_NAME,
      selectedBillingTier: "free" as SubscriptionTier,
      billing: {
        fullName: '',
        companyName: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        country: '',
      },
      card: {
        number: '',
        expDate: '',
        securityCode: ''
      },
      subInfo: undefined as SubInfo | undefined,
      savedCard: {
        name: '',
        last4: '',
        expDate: '',
      },
      alerts: {
        successUpdateSub: false,
        failedUpdateSub: false,
        successSaveInfo: false,
        failedSaveInfo: false
      },
    };
  },

  watch: {
    'user.activeProfile.showWatermark': {
      handler(val) {
        this.showWatermarkNotice = (!val && this.loaded);
      }
    }
  },

  async mounted() {
    await this.getUserData();

    this.loaded = true;

    await this.populateSubscriptionInfo();
    await this.populateBillingInfo();
    await this.populateCardInfo();
  },

  methods: {
    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const userResponse = await this.$axios.$post('/user', {
          token
        });

        const profileResponse = await this.$axios.$post('/profile/active-profile', {
          token
        });

        this.user.name = userResponse.name;
        this.user.emailHash = userResponse.emailHash;
        this.user.activeProfile.imageUrl = profileResponse.imageUrl;
        this.user.activeProfile.headline = profileResponse.headline;
        this.user.activeProfile.subtitle = profileResponse.subtitle;
        this.user.activeProfile.handle = profileResponse.handle;
        this.user.activeProfile.customDomain = profileResponse.customDomain;
        this.user.activeProfile.visibility = profileResponse.visibility;
        this.user.activeProfile.showWatermark = profileResponse.showWatermark;

        this.$set(this.user.activeProfile, 'user.activeProfile', profileResponse);

        this.originalHandle = this.user.activeProfile.handle;

        this.passwordEmail = localStorage.getItem("email");
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    async saveChanges() {
      try {
        await this.$axios.$post('/profile/update', {
          token: this.$store.getters['auth/getToken'],
          imageUrl: this.user.activeProfile.imageUrl ?? null,
          headline: this.user.activeProfile.headline ?? null,
          subtitle: this.user.activeProfile.subtitle ?? null,
          handle: this.user.activeProfile.handle ?? null,
          visibility: this.user.activeProfile.visibility ?? null,
          customDomain: this.user.activeProfile.customDomain ?? null,
          showWatermark: this.user.activeProfile.showWatermark ?? true,
        });

        if (process.client) {
          if (this.user.activeProfile.handle !== this.originalHandle) {
            location.reload();
            return;
          }

          this.$root.$emit('refreshUserProfileView');
        }
      } catch (err) {
        if (err.response) {
          if (err.response.status === StatusCodes.CONFLICT) {
            console.error("This handle is already being used by another profile.");
            this.error = "This handle is already being used by another profile.";

            return;
          }
        }

        throw err;
      }
    },

    setBillingModalActive(active: boolean) {
      this.billingModalActive = active;

      if (active) {
        setTimeout(() => {
          this.billingModalActive = false;
        }, 2000);
      }
    },

    setPasswordModalActive(active: boolean) {
      this.resetPasswordModalActive = active;

      if (active) {
        if (!this.passwordEmail) {
          this.passwordError = "Please enter a valid email.";
          return;
        } else {
          this.passwordError = '';
        }

        this.requestPasswordReset();
      }
    },

    setDeleteUserModalActive(active: boolean) {
      this.deleteUserModalActive = active;
    },

    async deleteUser() {
      this.$nuxt.$loading.start();

      await this.$axios.$post('/user/delete', {
        token: this.$store.getters['auth/getToken']
      });

      this.$nuxt.$loading.finish();

      this.$cookies.removeAll();

      window.location.replace('/');
    },

    async requestPasswordReset() {
      try {
        const request = await this.$axios.post('/user/request-reset-password', {
          email: this.passwordEmail
        });
        if (request.status && request.status === 200) {
          this.passwordError = '';
        }
      } catch (err) {
        console.error(err);

        this.passwordError = err.toString();

        if (err.response) {
          if (err.response.status === StatusCodes.NOT_FOUND) {
            this.passwordError = "The email couldn't be found, please make sure it's correct.";
          }

          if (err.response.status === StatusCodes.TOO_MANY_REQUESTS) {
            this.passwordError = `Whoa, slow down! Error: ${err.response.data.message}`;
          }

          return;
        }

        throw err;
      }
    },

    async downloadGDPRPackage() {
      if (process.client) {
        let token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/user/data-package', {
          token
        });

        let filename = "data.json";
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('filename') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const blob = new Blob([response.data], {type: 'application/pdf'});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
      }
    },

    async populateSubscriptionInfo() {
      const token = this.$store.getters['auth/getToken'];

      try {
        this.subInfo = await this.$axios.$post('/payments/sub-info', {
          token
        }) as SubInfo;
      } catch (e) {
        if (e.response?.status === StatusCodes.NOT_FOUND) {
          console.log("No billing info set.");
          return;
        }

        throw e;
      }
    },

    async populateBillingInfo() {
      const token = this.$store.getters['auth/getToken'];

      try {
        const response = await this.$axios.$post('/payments/get-billing-info', {
          token
        });

        this.billing.fullName = response.fullName;
        this.billing.companyName = response.companyName;
        this.billing.phone = response.phone;
        this.billing.address = response.address;
        this.billing.city = response.city;
        this.billing.zipCode = response.zipCode;
        this.billing.country = response.country;

      } catch (e) {
        if (e.response?.status === StatusCodes.NOT_FOUND) {
          console.log("No billing info set.");
          return;
        }

        throw e;
      }
    },

    async populateCardInfo() {
      const token = this.$store.getters['auth/getToken'];

      try {
        const response = await this.$axios.$post('/payments/get-card-info', {
          token
        });

        const ccName = response.name;
        const ccLast4 = response.last4;
        const ccExpDate = response.expDate;

        this.savedCard.name = ccName;
        this.savedCard.last4 = ccLast4;
        this.savedCard.expDate = ccExpDate;

      } catch (e) {
        if (e.response?.status === StatusCodes.NOT_FOUND) {
          console.log("No card info set.");
          return;
        }

        throw e;
      }
    },

    async saveCardInfo() {
      const token = this.$store.getters['auth/getToken'];

      try {
        await this.$axios.$post('/payments/set-card-info', {
          token,
          card: {
            number: this.card.number,
            expDate: this.card.expDate,
            cvc: this.card.securityCode
          }
        });

        this.alerts.successSaveInfo = true;
        this.alerts.failedSaveInfo = false;
      } catch (e) {
        if (e.response?.status === StatusCodes.BAD_REQUEST) {
          this.alerts.successSaveInfo = false;
          this.alerts.failedSaveInfo = true;
          return;
        }

        throw e;
      }
    },

    async saveBillingInfo() {
      const token = this.$store.getters['auth/getToken'];

      try {
        await this.$axios.$post('/payments/set-billing-info', {
          token,
          billing: {
            fullName: this.billing.fullName,
            companyName: this.billing.companyName ?? undefined,
            phone: this.billing.companyName ?? undefined,
            address: this.billing.address,
            city: this.billing.city,
            zipCode: this.billing.zipCode,
            country: this.billing.country
          }
        });

        this.alerts.successSaveInfo = true;
        this.alerts.failedSaveInfo = false;
      } catch (e) {
        if (e.response?.status === StatusCodes.BAD_REQUEST) {
          this.alerts.successSaveInfo = false;
          this.alerts.failedSaveInfo = true;
          return;
        }

        throw e;
      }
    }

  }
});
</script>

<style lang="scss">
.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

input, select {
  @apply font-bold;
}
</style>
