<template>
  <div class="container">
    <div class="content">
        <div class="card">
            <div class="star">
                <img src="/src/assets/icon-star.svg" alt="">
            </div>
            <h3>How did we do?</h3>
            <p>Please let us know how we did with your support request. All feedback is appreciated to help us improve our offering!</p>
            <div class="item_list" >
                <div class="item" v-for="item in store.items" @click="store.selectNumber(item)">{{ item }}</div>
            </div>
            <router-link to="/thank"><button>Submit</button></router-link>
            
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from "../store/select";
const store = useStore()

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
    }
    .star{
        height: 40px;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: hsl(217, 14%, 25%);
        border-radius: 30px;
    }
    .star img{
        width: 50%;
    }
    p{
        color: hsl(217, 12%, 63%);
        font-size: 13px;
    }
    .item_list{
        display: flex;
        align-items: center;
        gap: 15px;
    }
    .item{
        height: 40px;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: hsl(217, 14%, 25%);
        border-radius: 30px;
        color: hsl(217, 12%, 63%);
        cursor: pointer;
    }
    .item:hover{
        background-color: hsl(25, 97%, 53%);
        color: hsl(213, 19%, 18%);
        transition: .3s;
    }
    .item:active{
        background-color: #fff;
        color: hsl(213, 19%, 18%);
    }
    button{
        background-color: hsl(25, 97%, 53%);
        width: 100%;
        color: #000;
        border: none;
        display: flex;
        justify-content: center;
        padding: 10px 0;
        border-radius: 14px;
        margin-top: 10px;
    }
</style>