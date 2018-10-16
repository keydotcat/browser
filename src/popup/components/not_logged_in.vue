<template>
  <div>
    <div v-if="checking" class='container loading d-flex justify-content-center align-items-center'>
      <i class="material-icons spinner">replay</i>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'not-logged-in',
    data() {
      return {
        checking: true
      }
    },
    beforeMount(){
      browser.tabs.query({active:true,currentWindow:true}).then(function(tabs){
        var currentTabUrl = tabs[0].url
        console.log('csstas',currentTabUrl)
      })
    }
  }
</script>

<style lang="scss" scoped>
  .loading {
    width: 75px;
    height: 75px; 
  }

  .spinner {
    animation: spin 1.5s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(360deg); }
    100% { transform: rotate(0deg); }
  }
</style>
