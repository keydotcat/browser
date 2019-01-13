const webpack = require('webpack')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackShellPlugin = require('webpack-shell-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader')
const { VueLoaderPlugin } = require('vue-loader')
const { version } = require('./package.json')
const child_process = require('child_process')

const config = {
  mode: process.env.NODE_ENV,
  context: __dirname + '/src',
  entry: {
    'background/main': './background/main.js',
    'content/autofill': './content/autofill.js',
    'content/autofiller': './content/autofiller.ts',
    'content/notificationBar': './content/notificationBar.ts',
    'popup/popup': './popup/popup.js',
    'notification/bar': './notification/bar',
    'wui/wui': './wui/wui.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js'
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/')
    },
    extensions: ['.js', '.vue', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loaders: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.sass$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader?indentedSyntax']
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg|ico)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?emitFile=false'
        }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new CopyWebpackPlugin([
      { from: 'icons', to: 'icons', ignore: ['icon.xcf'] },
      { from: 'popup/popup.html', to: 'popup/popup.html' },
      { from: 'notification/bar.html', to: 'notification/bar.html' },
      { from: 'wui/wui.html', to: 'wui/wui.html' },
      { from: 'content/autofill.css', to: 'content/autofill.css' },
      { from: '../node_modules/argon2-browser/dist/argon2-asm.min.js' },
      { from: '../node_modules/argon2-browser/dist/argon2-asm.min.js', to: 'wui/argon2-asm.min.js' },
      {
        from: 'manifest.json',
        to: 'manifest.json',
        transform: content => {
          const jsonContent = JSON.parse(content)
          jsonContent.version = version

          if (config.mode === 'development') {
            jsonContent['content_security_policy'] = "script-src 'self' 'unsafe-eval'; object-src 'self'"
          }

          return JSON.stringify(jsonContent, null, 2)
        }
      }
    ]),
    new WebpackShellPlugin({
      onBuildEnd: ['node scripts/remove-evals.js']
    })
  ]
}

let defines = {}
if (config.mode === 'production') {
  let rgv = child_process
    .execSync('git describe --tags --always --abbrev=8')
    .toString()
    .trim()
  let cgv = child_process
    .execSync('git describe --tags --always --abbrev=8', { cwd: 'src/commonjs' })
    .toString()
    .trim()

  defines['GIT_REPO'] = `'${rgv}'`
  defines['GIT_FULL'] = `'extension: ${rgv}/ cjs: ${cgv}'`
  defines['process.env.NODE_ENV'] = '"production"'
} else {
  defines['GIT_REPO'] = '"dev"'
  defines['GIT_FULL'] = '"dev"'
}

config.plugins = (config.plugins || []).concat([new webpack.DefinePlugin(defines)])

if (process.env.HMR === 'true') {
  config.plugins = (config.plugins || []).concat([new ChromeExtensionReloader()])
}

module.exports = config
