<template>
  <div :class="{ expandHeight: loading }">
    <div v-if="loading" class="expandHeight d-flex justify-content-center align-items-center">
      <h1 class="display-4">We're loading!</h1>
    </div>
    <home-page v-if="!loading"></home-page>
  </div>
</template>

<script>
import HomePage from '@/commonjs/wui/components/home-page'

export default {
  name: 'keycat-wui',
  components: { HomePage },
  computed: {
    loading() {
      return this.$store.state.session.loading
    }
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Lato');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import '~bootstrap/scss/bootstrap.scss';
@import '~izitoast/dist/css/iziToast.min.css';

html,
body {
  /*font-family: 'Open Sans',serif;*/
  height: 100%;
  font-family: 'Lato';
}

.expandHeight {
  height: 100%;
}

/* switch */
$custom-control-description-disabled-color: #868e96;
$switch-height: calc(#{$input-height} * 0.8) !default;
$switch-height-sm: calc(#{$input-height-sm} * 0.8) !default;
$switch-height-lg: calc(#{$input-height-lg} * 0.8) !default;
$switch-border-radius: $switch-height !default;
$switch-bg: $custom-control-indicator-bg !default;
$switch-checked-bg: map-get($theme-colors, 'primary') !default;
$switch-disabled-bg: $custom-control-indicator-disabled-bg !default;
$switch-disabled-color: $custom-control-description-disabled-color !default;
$switch-thumb-bg: $white !default;
$switch-thumb-border-radius: 50% !default;
$switch-thumb-padding: 2px !default;
$switch-focus-box-shadow: 0 0 0 $input-btn-focus-width rgba(map-get($theme-colors, 'primary'), 0.25);
$switch-transition: 0.2s all !default;

.switch {
  font-size: $font-size-base;
  position: relative;

  input {
    position: absolute;
    height: 1px;
    width: 1px;
    background: none;
    border: 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    overflow: hidden;
    padding: 0;

    + label {
      position: relative;
      min-width: calc(#{$switch-height} * 2);
      border-radius: $switch-border-radius;
      height: $switch-height;
      line-height: $switch-height;
      display: inline-block;
      cursor: pointer;
      outline: none;
      user-select: none;
      vertical-align: middle;
      text-indent: calc(calc(#{$switch-height} * 2) + 0.5rem);
    }

    + label::before,
    + label::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: calc(#{$switch-height} * 2);
      bottom: 0;
      display: block;
    }

    + label::before {
      right: 0;
      background-color: $switch-bg;
      border-radius: $switch-border-radius;
      transition: $switch-transition;
    }

    + label::after {
      top: $switch-thumb-padding;
      left: $switch-thumb-padding;
      width: calc(#{$switch-height} - calc(#{$switch-thumb-padding} * 2));
      height: calc(#{$switch-height} - calc(#{$switch-thumb-padding} * 2));
      border-radius: $switch-thumb-border-radius;
      background-color: $switch-thumb-bg;
      transition: $switch-transition;
    }

    &:checked + label::before {
      background-color: $switch-checked-bg;
    }

    &:checked + label::after {
      margin-left: $switch-height;
    }

    &:focus + label::before {
      outline: none;
      box-shadow: $switch-focus-box-shadow;
    }

    &:disabled + label {
      color: $switch-disabled-color;
      cursor: not-allowed;
    }

    &:disabled + label::before {
      background-color: $switch-disabled-bg;
    }
  }

  // Small variation
  &.switch-sm {
    font-size: $font-size-sm;

    input {
      + label {
        min-width: calc(#{$switch-height-sm} * 2);
        height: $switch-height-sm;
        line-height: $switch-height-sm;
        text-indent: calc(calc(#{$switch-height-sm} * 2) + 0.5rem);
      }

      + label::before {
        width: calc(#{$switch-height-sm} * 2);
      }

      + label::after {
        width: calc(#{$switch-height-sm} - calc(#{$switch-thumb-padding} * 2));
        height: calc(#{$switch-height-sm} - calc(#{$switch-thumb-padding} * 2));
      }

      &:checked + label::after {
        margin-left: $switch-height-sm;
      }
    }
  }

  // Large variation
  &.switch-lg {
    font-size: $font-size-lg;

    input {
      + label {
        min-width: calc(#{$switch-height-lg} * 2);
        height: $switch-height-lg;
        line-height: $switch-height-lg;
        text-indent: calc(calc(#{$switch-height-lg} * 2) + 0.5rem);
      }

      + label::before {
        width: calc(#{$switch-height-lg} * 2);
      }

      + label::after {
        width: calc(#{$switch-height-lg} - calc(#{$switch-thumb-padding} * 2));
        height: calc(#{$switch-height-lg} - calc(#{$switch-thumb-padding} * 2));
      }

      &:checked + label::after {
        margin-left: $switch-height-lg;
      }
    }
  }

  + .switch {
    margin-left: 1rem;
  }
}
</style>
