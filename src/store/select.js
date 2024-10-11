import { defineStore } from "pinia";
import { ref } from "vue";
export const useStore = defineStore('mystore', () =>{
    const items = [1 , 2 , 3 , 4 , 5]
    const selectedNumber = ref(0)
    function selectNumber(item) {
        selectedNumber.value = item 
        console.log(selectedNumber.value);
        
    }
    return {items, selectedNumber,selectNumber }
})