<script lang="ts" setup>
import Header from '../components/Header.vue';
import Navigation from '../components/Navigation.vue';
import Footer from '../components/Footer.vue';
</script>

<template>
    <div class="common-layout">
        <div class="header">
            <Header></Header>
        </div>
        <div class="center">
            <div class="nav">
                <Navigation></Navigation>
            </div>
            <div class="main">
                <router-view />
            </div>
        </div>
        <div class="footer">
            <Footer></Footer>
        </div>
    </div>
</template>

<style scoped>
.common-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    height: 60px;
    width: 100vw;
    background-color: #f5f5f5;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
}

.center {
    display: flex;
    flex: 1;
    margin-top: 60px;
    margin-bottom: 60px;
    height: calc(100vh - 120px);
    min-height: 0;
    /* 让子元素撑满高度 */
    overflow: hidden;
}

.nav {
    width: 200px;
    min-width: 160px;
    background: #20232a;
    color: #fff;
    height: 100%;
    overflow-y: auto;
    flex-shrink: 0;
}

.main {
    flex: 1;
    background: #fff;
    padding: 24px;
    overflow-y: auto;
    min-width: 0;
    height: 100%;
    /* 关键：让main高度撑满center并可滚动 */
    box-sizing: border-box;
}

.footer {
    height: 60px;
    width: 100vw;
    background-color: #f5f5f5;
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>