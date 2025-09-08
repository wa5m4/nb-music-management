<script setup lang="ts">
import Navigation from './components/Navigation.vue'
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <Header></Header>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <Navigation />
        </el-aside>
        <el-container>
          <el-main>
            <router-view />
          </el-main>
          <el-footer>
            <Footer></Footer>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
html {
  position: absolute;
  margin: 0;
  padding: 0;
  /* height: 100vh; */
}
</style>
