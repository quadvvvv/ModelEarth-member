# Bun

## What is Bun?

Bun is a high-performance and lightweight JavaScript **runtime** built on top of JavaScriptCore, the engine used by Safari. It serves as an alternative to Node.js.

Bun provides the following tools:
1. **JavaScript Runtime**: The core of Bun.
2. **Bundler and Transpiler**: For asset optimization.
3. **Package Manager**: To manage dependencies.

The runtime capabilities of Bun are primarily utilized for server-side logic.

## What if We Want to Host a Static Website on GitHub Pages?

Even if you are hosting a static website on GitHub Pages, you can still benefit from the optimizations that Bun offers in terms of development and build features. For instance, Bun can bundle and optimize your assets, resulting in smaller file sizes and faster load times after the app is built, thus improving performance when hosted on GitHub Pages.

## How to Use Bun to Create an App

### Prerequisites

You need to install Bun first. You can do this in one of the following ways:

```shell
# Bun's install script
curl -fsSL https://bun.sh/install | bash
```

```shell
# Alternatively, using npm
npm install -g bun
```

## How to use Bun to Create an App?

### Prerequisite:

We have to install bun in some way... 

```
// bun's install script 
curl https://bun.sh/install | bash
// with npm
npm install -g bun
```

### Option 1: Create a React App with Bun's Bootstrapping the regular create-react-app

```shell
    bun create react-app ./you-app-name
```

```shell
    cd your-app-name
    bun start // You can now see the React logo on your localhost!
```

### Option 2: Create a React App with Bun and Vite (Recommended for because it's the fastest way to do so :))

```shell
    bun create vite your-app-name
```

You will then be prompted to choose a framework, such as React, Vanilla, Vue, etc. You will also select a variant, like TypeScript, JavaScript, TypeScript + SWC, or JavaScript + SWC.

```shell
    cd your-app-name
    bun install # Install the dependencies
    bun dev # You can now see the (Vite + React) logos on your localhost!
```

# Tailwind.css
# Daisy UI
```shell
    bun add tailwindcss postcss autoprefixer
```
bun add -d tailwindcss postcss autoprefixer

This command adds Tailwind CSS as a dependency to your project.
It updates your package.json file, adding Tailwind CSS to the dependencies list.
It downloads and installs Tailwind CSS in your node_modules folder.

bun x tailwindcss init

```javascript
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add Tailwind directives to the CSS file (index.css, app.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```


