# People Groups Field Definitions

This document describes all custom fields available for the `peoplegroups` post type.

---

## Doxa Fields

### `doxa_masteruid`
- **Label:** Doxa Master UID
- **Type:** text
- **Description:** The Doxa Master UID for the people group
- **Examples:** `"12345"`, `"DOXA-AF-001"`

### `doxa_wagf_region`
- **Label:** WAGF - Region
- **Type:** key_select
- **Description:** The WAGF (World Assemblies of God Fellowship) region for the people group
- **Example Values:**
  - `africa` → "Africa"
  - `asia` → "Asia"
  - `europe` → "Europe"
  - `latin_america_&_caribbean` → "Latin America & Caribbean"
  - `middle_east` → "Middle East"
  - `north_america_&_non-spanish_caribbean` → "North America & Non-Spanish Caribbean"
  - `oceania` → "Oceania"
  - `na` → "N/A"

### `doxa_wagf_block`
- **Label:** WAGF - Block
- **Type:** key_select
- **Description:** The WAGF block (sub-region) for the people group
- **Example Values:**
  - `andean` → "Andean"
  - `brazil` → "Brazil"
  - `central_africa` → "Central Africa"
  - `central_america` → "Central America"
  - `central_asia` → "Central Asia"
  - `east_africa` → "East Africa"
  - `middle_east` → "Middle East"
  - `south_asia` → "South Asia"
  - `south_east_asia` → "South East Asia"
  - `west_africa` → "West Africa"

### `doxa_wagf_member`
- **Label:** WAGF - Member of WAGF
- **Type:** key_select
- **Description:** Is the WAGF region a member
- **Example Values:**
  - `no` → "No"
  - `yes` → "Yes"
  - `na` → "N/A"

### `doxa_wagf_uid`
- **Label:** WAGF - UID
- **Type:** text
- **Description:** The WAGF UID for the people group
- **Examples:** `"WAGF-001"`, `"12345"`

---

## IMB Identifier Fields

### `imb_uid`
- **Label:** IMB - UID
- **Type:** text
- **Description:** The IMB UID for the people group
- **Examples:** `"12345"`, `"IMB-00001"`

### `imb_pgid`
- **Label:** IMB - People Group ID (PGID)
- **Type:** text
- **Description:** The IMB People Groups.org ID for the people group
- **Examples:** `"10001"`, `"23456"`

### `imb_peid`
- **Label:** IMB - PEID
- **Type:** text
- **Description:** The IMB ID for the people group
- **Examples:** `"34567"`, `"45678"`

---

## IMB Name Fields

### `imb_people_name`
- **Label:** IMB - People Name
- **Type:** text
- **Description:** The name for the people group (relates to the ROP3 field)
- **Examples:** `"Pashtun"`, `"Baloch"`, `"Arab, Iraqi"`

### `imb_display_name`
- **Label:** IMB - Display Name
- **Type:** text
- **Description:** The display name for the people group for using in the UI
- **Examples:** `"Pashtun of Afghanistan"`, `"Baloch of Pakistan"`

### `imb_alternate_name`
- **Label:** IMB - Alternate Name
- **Type:** text
- **Description:** The alternate name for the people group
- **Examples:** `"Pathan"`, `"Baluchi"`

---

## IMB Geographic Fields

### `imb_isoalpha3`
- **Label:** IMB - ISO Alpha 3 Country code
- **Type:** key_select
- **Description:** The ISO Alpha 3 code for the country where the people group resides
- **Example Values:**
  - `AFG` → "Afghanistan"
  - `IND` → "India"
  - `PAK` → "Pakistan"
  - `USA` → "the United States"
  - `CHN` → "China"
  - `NGA` → "Nigeria"
  - `IDN` → "Indonesia"

### `imb_region`
- **Label:** IMB - Region
- **Type:** key_select
- **Description:** The region for the people group
- **Example Values:**
  - `europe` → "Europe"
  - `asia` → "Asia"
  - `africa` → "Africa"
  - `americas` → "Americas"
  - `oceania` → "Oceania"

### `imb_subregion`
- **Label:** IMB - Sub Region
- **Type:** key_select
- **Description:** The subregion for the people group
- **Example Values:**
  - `southern_europe` → "Southern Europe"
  - `eastern_asia` → "Eastern Asia"
  - `eastern_africa` → "Eastern Africa"
  - `northern_america` → "Northern America"
  - `western_europe` → "Western Europe"
  - `southern_asia` → "Southern Asia"
  - `western_asia` → "Western Asia"
  - `central_asia` → "Central Asia"
  - `melanesia` → "Melanesia"

### `imb_lat`
- **Label:** IMB - Latitude
- **Type:** number
- **Description:** The latitude for the people group's primary location
- **Examples:** `34.5553`, `-1.2921`, `28.6139`

### `imb_lng`
- **Label:** IMB - Longitude
- **Type:** number
- **Description:** The longitude for the people group's primary location
- **Examples:** `69.2075`, `36.8219`, `77.2090`

---

## IMB Affinity & Classification Fields

### `imb_affinity_code`
- **Label:** IMB - Affinity Code
- **Type:** key_select
- **Description:** The affinity code for the people group
- **Example Values:**
  - `AG100` → "European Peoples"
  - `AG200` → "Northern African and Middle Eastern Peoples"
  - `AG300` → "Sub-Saharan African Peoples"
  - `AG400` → "Central Asian Peoples"
  - `AG500` → "South Asian Peoples"
  - `AG650` → "Asian Pacific Rim Peoples"
  - `AG800` → "American Peoples"
  - `AG900` → "Deaf Peoples"

---

## IMB Description Fields

### `imb_people_description`
- **Label:** IMB - People Description
- **Type:** textarea
- **Description:** The description of the people group
- **Examples:** Long-form text describing the people group's culture, history, and way of life.

### `imb_location_description`
- **Label:** IMB - Location Description
- **Type:** textarea
- **Description:** The location description of where the people live
- **Examples:** `"The Pashtun live primarily in southern and eastern Afghanistan and western Pakistan."`, `"Concentrated in the Punjab region of Pakistan and India."`

---

## IMB Population Fields

### `imb_population`
- **Label:** IMB - Population
- **Type:** number
- **Description:** The population for the people group
- **Examples:** `15000000`, `250000`, `5000`

### `imb_population_class`
- **Label:** IMB - Population Class
- **Type:** key_select
- **Description:** The population class for the people group
- **Example Values:**
  - `0` → "Less than 10,000"
  - `1` → "100,000 - 249,999"
  - `2` → "25,000 - 49,999"
  - `3` → "250,000 - 499,999"
  - `4` → "10,000 - 24,999"
  - `5` → "500,000 - 999,999"
  - `6` → "50,000 - 99,999"
  - `7` → "1,000,000 - 2,499,999"
  - `8` → "5,000,000 - 9,999,999"
  - `9` → "2,500,000 - 4,999,999"
  - `10` → "10,000,000+"

---

## IMB Evangelical & Spiritual Status Fields

### `imb_evangelical_percentage`
- **Label:** IMB - Evangelical Percentage
- **Type:** number
- **Description:** The evangelical percentage for the people group
- **Examples:** `0.01`, `2.5`, `15.0`, `45.5`

### `imb_evangelical_level`
- **Label:** IMB - Evangelical Level
- **Type:** key_select
- **Description:** The evangelical level for the people group
- **Example Values:**
  - `0` → "No Known Evangelicals"
  - `1` → "Less than 2%"
  - `2` → "2% or Greater but Less than 5%"
  - `3` → "5% or Greater but Less than 10%"
  - `4` → "10% or Greater but Less than 15%"
  - `5` → "15% or Greater but Less than 20%"
  - `6` → "20% or Greater but Less than 30%"
  - `7` → "30% or Greater but Less than 40%"
  - `8` → "40% or Greater but Less than 50%"
  - `9` → "50% or Greater but Less than 75%"
  - `10` → "75% or Greater"

### `imb_congregation_existing`
- **Label:** IMB - Congregation Existence
- **Type:** key_select
- **Description:** The existence of a congregation within the people group
- **Example Values:**
  - `0` → "No"
  - `1` → "Yes"

### `imb_church_planting`
- **Label:** IMB - Church Planting Status
- **Type:** key_select
- **Description:** The church planting status for the people group
- **Example Values:**
  - `0` → "No churches planted"
  - `1` → "Dispersed church planting"
  - `2` → "Concentrated church planting"

### `imb_engagement_status`
- **Label:** IMB - Engagement Status
- **Type:** key_select
- **Description:** The engagement status for the people group
- **Example Values:**
  - `engaged` → "Engaged"
  - `unengaged` → "Unengaged"

### `imb_gsec`
- **Label:** IMB - GSEC
- **Type:** key_select
- **Description:** Global Status of Evangelical Christianity
- **Example Values:**
  - `0` → "No Evangelicals, Churches or Resources"
  - `1` → "Less than 2% Evangelical, No Active CP Activity"
  - `2` → "Less than 2% Evangelical, Concentrated CP Activity"
  - `3` → "Less than 2% Evangelical, Dispersed CP Activity"
  - `4` → "2% or Greater but Less than 5% Evangelical"
  - `5` → "5% or Greater but Less than 10% Evangelical"
  - `6` → "10% or Greater Evangelical"

### `imb_strategic_priority_index`
- **Label:** IMB - Strategic Priority Index
- **Type:** key_select
- **Description:** The Strategic Priority Index for the people group
- **Example Values:**
  - `0` → "Unengaged and Unreached"
  - `1` → "Engaged yet Unreached"
  - `2` → "No Longer Unreached"

### `imb_lostness_priority_index`
- **Label:** IMB - Lostness Priority Index
- **Type:** key_select
- **Description:** The Lostness Priority Index for the people group
- **Example Values:**
  - `0` → "Frontier Unreached People Group" (< 0.1% Evangelical)
  - `1` → "Pioneer Unreached People Group" (0.1% to 0.5% Evangelical)
  - `2` → "Expanding Unreached People Group" (0.5% to 2% Evangelical)
  - `3` → "Minimally Reached People Group" (2% to 3% Evangelical)
  - `4` → "Marginally Reached People Group" (3% to 6% Evangelical)
  - `5` → "Moderately Reached People Group" (6% to 20% Evangelical)
  - `6` → "Significantly Reached People Group" (> 20% Evangelical)

---

## IMB Language Fields

### `imb_reg_of_language`
- **Label:** IMB - Registry of Language
- **Type:** key_select
- **Description:** The registry of language for the people group (ISO 639-3 code)
- **Example Values:**
  - `eng` → "English"
  - `spa` → "Spanish"
  - `ara` → "Arabic"
  - `hin` → "Hindi"
  - `mya` → "Burmese"
  - `vie` → "Vietnamese"
  - `por` → "Portuguese"

### `imb_language_family`
- **Label:** IMB - Language Family
- **Type:** key_select
- **Description:** The language family for the people group
- **Example Values:**
  - `afro-asiatic` → "Afro-Asiatic"
  - `indo-european` → "Indo-European"
  - `sino-tibetan` → "Sino-Tibetan"
  - `austronesian` → "Austronesian"
  - `atlantic-congo` → "Atlantic-Congo"
  - `turkic` → "Turkic"

### `imb_language_class`
- **Label:** IMB - Language Class
- **Type:** key_select
- **Description:** The language class for the people group (more specific classification)
- **Example Values:**
  - `0` → "Abkhaz-Adyghe, Abkhaz-Abazin"
  - `1` → "Abkhaz-Adyghe, Circassian"
  - `3` → "Afro-Asiatic, Berber, Northern"
  - `10` → "Afro-Asiatic, Berber, Tamasheq, Northern"

### `imb_language_speakers`
- **Label:** IMB - Language Speakers
- **Type:** number
- **Description:** The number of language speakers for the people group
- **Examples:** `1000000`, `50000`, `250000000`

---

## IMB Religion Fields

### `imb_reg_of_religion`
- **Label:** ROR - Registry of Religion
- **Type:** key_select
- **Description:** The religion for the people group (detailed classification with descriptions)
- **Example Values:**
  - `CRC` → "Christianity - Roman Catholicism"
  - `CPR` → "Christianity - Protestantism"
  - `COR` → "Christianity - Eastern Orthodox"
  - `MSN` → "Islam - Sunni"
  - `MSH` → "Islam - Shia"
  - `MOF` → "Islam - Folk"
  - `BTH` → "Buddhism - Theravada"
  - `BMA` → "Buddhism - Mahayana"
  - `BLA` → "Buddhism - Tibetan"
  - `H` → "Hinduism"
  - `HOF` → "Hinduism - Folk"
  - `EAF` → "Ethnoreligion - African Traditional Religion"
  - `EAN` → "Ethnoreligion - Animism"
  - `J` → "Judaism"
  - `S` → "Sikhism"
  - `N` → "Unaffiliated"

### `imb_reg_of_religion_3`
- **Label:** IMB - Registry of Religion ROR3
- **Type:** key_select
- **Description:** The registry of religion (top-level classification)
- **Example Values:**
  - `C` → "Christianity"
  - `M` → "Islam"
  - `B` → "Buddhism"
  - `H` → "Hinduism"
  - `E` → "Ethnoreligion"
  - `J` → "Judaism"
  - `S` → "Sikhism"
  - `N` → "Unaffiliated"
  - `O` → "Other"
  - `U` → "Unknown"

### `imb_reg_of_religion_4`
- **Label:** IMB - Registry of Religion ROR4
- **Type:** key_select
- **Description:** The registry of religion (branch/tradition level)
- **Example Values:**
  - `CRC` → "Roman Catholicism"
  - `CPR` → "Protestantism"
  - `COR` → "Eastern Orthodoxy"
  - `MSN` → "Sunni Islam"
  - `MSH` → "Shia Islam"
  - `MOF` → "Folk Islam"
  - `BTH` → "Theravada Buddhism"
  - `BMA` → "Mahayana Buddhism"
  - `HOF` → "Folk Hinduism"
  - `EAF` → "African Traditional Religion"

---

## IMB Registry of Peoples Fields

### `imb_reg_of_people_3`
- **Label:** ROP3 - ID
- **Type:** number
- **Description:** The ROP3 ID for the people group (unique identifier at the most specific level)
- **Examples:** `100001`, `200045`, `305678`

### `imb_reg_of_people_25`
- **Label:** ROP25 - Ethne
- **Type:** key_select
- **Description:** The ethne of the people group (ethnic classification)
- **Examples:** Values map to specific ethnic groupings

### `imb_reg_of_people_2`
- **Label:** ROP2 - People Cluster
- **Type:** key_select
- **Description:** The people cluster for the people group
- **Example Values:**
  - `C0098` → "Italian"
  - `C0182` → "Portuguese, European"
  - `C0123` → "Malay"
  - `C0065` → "Chinese"
  - `C0228` → "Vietnamese"
  - `C0252` → "Deaf"
  - `C0267` → "Bantu, East-Coastal"

### `imb_reg_of_people_1`
- **Label:** ROP1 - Affinity Block
- **Type:** key_select
- **Description:** The affinity block for the people group
- **Example Values:**
  - `A001` → "Arab World"
  - `A002` → "East Asian Peoples"
  - `A003` → "Eurasian Peoples"
  - `A004` → "Horn of Africa"
  - `A005` → "Persian-Median"
  - `A006` → "Jewish Peoples"
  - `A007` → "Latin-Caribbean Americans"
  - `A008` → "Malay Peoples"
  - `A009` → "North American Peoples"
  - `A010` → "Pacific Islanders"
  - `A011` → "Southeast Asian Peoples"
  - `A012` → "South Asian Peoples"
  - `A013` → "Sub-Saharan African"
  - `A014` → "Tibetan / Himalayan Peoples"
  - `A015` → "Turkic Peoples"
  - `A017` → "Deaf Peoples"

---

## IMB Resource Availability Fields

### `imb_bible_available`
- **Label:** IMB - Bible Translation Status
- **Type:** key_select
- **Description:** The bible translation status for the people group
- **Example Values:**
  - `0` → "Not Available"
  - `1` → "Available"
  - `2` → "None"

### `imb_jesus_film_available`
- **Label:** IMB - Jesus Film Status
- **Type:** key_select
- **Description:** The Jesus film status for the people group
- **Example Values:**
  - `0` → "Not Available"
  - `1` → "Available"
  - `2` → "None"

### `imb_radio_broadcast_available`
- **Label:** IMB - Radio Broadcast Status
- **Type:** key_select
- **Description:** The radio broadcast status for the people group
- **Example Values:**
  - `0` → "Not Available"
  - `1` → "Available"
  - `2` → "None"

### `imb_gospel_recordings_available`
- **Label:** IMB - Gospel Translation Status
- **Type:** key_select
- **Description:** The gospel translation status for the people group
- **Example Values:**
  - `0` → "Not Available"
  - `1` → "Available"
  - `2` → "None"

### `imb_audio_scripture_available`
- **Label:** IMB - Audio Bible Status
- **Type:** key_select
- **Description:** The audio bible status for the people group
- **Example Values:**
  - `0` → "Not Available"
  - `1` → "Available"
  - `2` → "None"

### `imb_bible_stories_available`
- **Label:** IMB - Bible Stories Translation Status
- **Type:** key_select
- **Description:** The bible stories translation status for the people group
- **Example Values:**
  - `0` → "Not Available"
  - `1` → "Available"
  - `2` → "None"

### `imb_total_resources_available`
- **Label:** IMB - Total Resources Available
- **Type:** number
- **Description:** The total resources available for the people group
- **Examples:** `0`, `3`, `6` (count of available resources)

### `imb_bible_translation_level`
- **Label:** IMB - Bible Translation Level
- **Type:** key_select
- **Description:** The bible translation level for the people group
- **Example Values:**
  - `0` → "None"
  - `1` → "Stories"
  - `2` → "Selections"
  - `3` → "New Testament"
  - `4` → "Bible"

### `imb_bible_year_published`
- **Label:** IMB - Year of Bible Publication
- **Type:** text
- **Description:** The year of bible publication for the people group
- **Examples:** `"1978"`, `"2015"`, `"1611"`

---

## IMB Media & Visual Fields

### `imb_picture_credit_html`
- **Label:** IMB - Picture Credit HTML
- **Type:** textarea
- **Description:** The picture credit for the people group (HTML formatted)
- **Examples:** `"<a href='https://example.com'>Photo by John Doe</a>"`, `"Public Domain"`

### `imb_picture_url`
- **Label:** IMB - Picture URL
- **Type:** text
- **Description:** The picture url for the people group
- **Examples:** `"https://joshuaproject.net/assets/media/profiles/photos/p10001.jpg"`

### `imb_has_photo`
- **Label:** IMB - Photo URL
- **Type:** boolean
- **Description:** Whether the people group has a photo available
- **Examples:** `true`, `false`

---

## IMB Other Fields

### `imb_is_indigenous`
- **Label:** IMB - Indigenous Status
- **Type:** key_select
- **Description:** The indigenous status for the people group
- **Example Values:**
  - `0` → "Diaspora"
  - `1` → "Indigenous"

### `imb_people_search_text`
- **Label:** IMB - People Search Text
- **Type:** text
- **Description:** The people search text for the people group (used for search indexing)
- **Examples:** `"Pashtun Pathan Afghan Pushtan"`, `"Arab Iraqi Mesopotamian"`

---

## Mobilization Fields

### `adopted_by_churches`
- **Label:** Adopted by Churches
- **Type:** connection
- **Description:** Churches that have adopted this people group
- **Post Type:** groups
- **P2P Direction:** from
- **P2P Key:** peoplegroups_to_groups
- **Examples:** Links to group records representing churches

### `people_praying`
- **Label:** People Praying
- **Type:** number
- **Description:** Number of people praying for this people group
- **Examples:** `0`, `15`, `250`, `1000`

---

## System Fields

### `slug`
- **Label:** SLUG
- **Type:** text (readonly)
- **Description:** Unique slug for this people group to be used in the URL
- **Examples:** `"pashtun-afghanistan"`, `"baloch-pakistan"`, `"arab-iraqi"`
