import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Thank from "./views/Thank.vue";
import TestWexgoFlow from "./views/TestWexgoFlow.vue";

const routes = [
    {
        path: '/',
        component: Home  
    },

    {
        path: '/thank',
        component: Thank  
    },

    {
        path: '/test-wexgo-flow',
        component: TestWexgoFlow  
    }
]

export default createRouter({
    history: createWebHistory(),
    routes
});
