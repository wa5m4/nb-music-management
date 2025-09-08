<script lang="ts" setup>

</script>

<template>
    <el-row :gutter="10">
        <el-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
            <div class="grid-content ep-bg-purple">LOGO</div>
        </el-col>
        <el-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
            <div class="grid-content ep-bg-purple-light">Search</div>
        </el-col>
        <el-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
            <div class="grid-content ep-bg-purple">User</div>
        </el-col>
        <el-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
            <div class="grid-content ep-bg-purple-light">Setting</div>
        </el-col>
    </el-row>
</template>

<style scoped>
.el-col {
    border-radius: 4px;
}

.grid-content {
    border-radius: 4px;
    min-height: 36px;
}
</style>