<template>
  <button><slot></slot></button>
</template>

<script>
import Clip from 'clipboard'
import $ from 'jquery'

export default {
  name: 'copy-button',
  props: {
    copy: String
  },
  data() {
    return {
      btn: null
    }
  },
  mounted() {
    $(this.$el).tooltip({
      title: 'Copied!'
    })
    $(this.$el).tooltip('disable')
    var self = this
    this.btn = new Clip(this.$el, {
      text: function(trigger) {
        return self.copy
      }
    })
    this.btn.on('success', e => {
      self.$emit('copied', this.$el)
      $(this.$el).tooltip('enable')
      $(this.$el).tooltip('show')
      window.setTimeout(() => {
        $(this.$el).tooltip('hide')
        $(this.$el).tooltip('disable')
      }, 1000)
    })
  },
  beforeDestroy() {
    $(this.$el).tooltip('dispose')
    this.btn.destroy()
  }
}
</script>
