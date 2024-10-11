import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Thank from "./views/Thank.vue";

const routes = [
    {
        path: '/',
        component: Home  
    },

    {
        path: '/thank',
        component: Thank  
    }
]

export default createRouter({
    history: createWebHistory(),
    routes
});
