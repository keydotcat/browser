<template>
  <form class="text-left">
    <div class="p-1">
      <div class="form-group">
        <label for="formControlRange">Length: {{ genOpts.len }} characters</label>
        <input type="range" @change="gen()" v-model="genOpts.len" class="form-control-range p-1" min="1" max="40" id="formControlRange" />
      </div>
      <div class="form-group">
        <label>Characters</label>
        <div class="d-flex">
          <div class="btn-group pl-1" role="group" aria-label="Enabled characters">
            <button
              type="button"
              class="btn btn-sm btn-outline-info"
              :class="{ active: genOpts.low, disabled: genOpts.unicode }"
              @click.prevent="gen((genOpts.low = !genOpts.low))"
            >
              a-z
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-info"
              :class="{ active: genOpts.upp, disabled: genOpts.unicode }"
              @click.prevent="gen((genOpts.upp = !genOpts.upp))"
            >
              A-Z
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-info"
              :class="{ active: genOpts.num, disabled: genOpts.unicode }"
              @click.prevent="gen((genOpts.num = !genOpts.num))"
            >
              0-9
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-info"
              :class="{ active: genOpts.sym, disabled: genOpts.unicode }"
              @click.prevent="gen((genOpts.sym = !genOpts.sym))"
            >
              Symbols
            </button>
          </div>
          <button type="button" class="ml-1 btn btn-sm btn-outline-info" :class="{ active: genOpts.unicode }" @click.prevent="gen((genOpts.unicode = !genOpts.unicode))">
            Full unicode
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>Password</label>
        <div class="input-group p-1">
          <div class="input-group-prepend">
            <span class="input-group-text" @click.prevent="display = !display">
              <i class="material-icons" v-if="!display">visibility</i>
              <i class="material-icons" v-if="display">visibility_off</i>
            </span>
          </div>
          <input type="text" v-if="display" class="form-control" v-model="pass" />
          <input type="password" v-if="!display" class="form-control" v-model="pass" />
          <div class="input-group-append">
            <copy-button class="input-group-text" :copy="pass">
              <i class="material-icons">file_copy</i>
            </copy-button>
          </div>
        </div>
      </div>
      <div class="p-1 d-flex mb-3">
        <button type="button" class="btn btn-outline-dark d-flex" @click.prevent="gen()">
          <i class="material-icons">autorenew</i>
          Generate again
        </button>
      </div>
      <div class="p-1 d-flex">
        <button type="button" class="btn btn-outline-success d-flex" @click.prevent="fill()">
          <i class="material-icons">open_in_browser</i>
          Fill page form with password
        </button>
      </div>
    </div>
  </form>
</template>

<script>
import jsspg from 'javascript-strong-password-generator'
import tabData from '@/popup/tab-data'
import CopyButton from './copy-button'

function getRandomArray(len) {
  const crypto = window.crypto || window.msCrypto
  const randomValues = new Uint32Array(len)
  crypto.getRandomValues(randomValues)
  return randomValues
}

jsspg.init({
  entropyFxn: () => {
    return Array.from(getRandomArray(128))
  }
})

var charSets = {
  num: '0123456789',
  low: 'abcdefghijklmnopqrstuvwxyz',
  upp: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  sym: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
}

function generateNormalPass(opts) {
  var gp = []
  var cs = ''
  if (opts.num) {
    cs += charSets.num
  }
  if (opts.low) {
    cs += charSets.low
  }
  if (opts.upp) {
    cs += charSets.upp
  }
  if (opts.sym) {
    cs += charSets.sym
  }
  var csl = cs.length
  var ra = getRandomArray(opts.len)
  for (var i = 0; i < opts.len; i++) {
    gp.push(cs[Math.floor(((1.0 * ra[i]) / Math.pow(2, 32)) * csl)])
  }
  return gp.join('')
}

export default {
  name: 'generator-tab',
  components: { CopyButton },
  data() {
    return {
      pass: '',
      display: true,
      genOpts: {
        len: 15,
        unicode: false,
        low: true,
        upp: true,
        num: true,
        sym: true
      }
    }
  },
  beforeMount() {
    this.gen()
  },
  methods: {
    gen() {
      if (this.genOpts.unicode) {
        this.pass = jsspg.generate(this.genOpts.len)
      } else {
        this.pass = generateNormalPass(this.genOpts)
      }
    },
    fill() {
      tabData.fillWithCred({ password: this.pass })
    }
  }
}
</script>

<style>
.footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
}
</style>
