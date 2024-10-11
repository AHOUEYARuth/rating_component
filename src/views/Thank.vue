<template>
  <div class="container">
    <div class="content">
        <img src="/src/assets/illustration-thank-you.svg" alt="">
        <button>You selected <span>{{ storeI.selectedNumber }}</span> out of 5</button>
        <h3>Thank you!</h3>
        <p> We appreciate you taking the time to give a rating. If you ever need more support, 
            don’t hesitate to get in touch!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from "../store/select";
const storeI = useStore()
</script>


<style scoped>
    .container{
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .content{
        width: 260px;
        background-color: hsl(213, 19%, 18%);
        padding: 20px;
        border-radius: 10px;
        color: hsl(0, 0%, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .content img{
        width: 50%;
    }
    button{
        background-color: hsl(217, 14%, 25%);
        color: hsl(25, 97%, 53%);
        border: none;
        padding: 8px;
        border-radius: 10px;
        margin-top: 15px;
    }
    p{
        color: hsl(217, 12%, 63%);
        font-size: 13px;
        text-align: center;
    }
</style>