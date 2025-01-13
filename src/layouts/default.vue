<template>
  <v-main>
    <header class="header">
      <RouterLink to="/">Main</RouterLink>
      <RouterLink to="/audio">Audio</RouterLink>
    </header>
    <router-view />
  </v-main>

  <AppFooter />
</template>

<script lang="ts" setup>
//
</script>

<style lang="css" scoped>
.header {
  display: flex;
  width: 100%;
  gap: 20px;
  padding: 20px 16px;
}
</style>
