<template>
    <div id="vue-frontend-app">
        <component
            v-for="(component, index) in globalTop"
            :key="index"
            :is="component"
        />
        <router-view />
    </div>
</template>

<script>

export default {
    name: 'App',
    data () {
        return {
            globalTop: wepos.hooks.applyFilters( 'wepos_global_top', [] ),
        }
    }
};

</script>

<style>

</style>
