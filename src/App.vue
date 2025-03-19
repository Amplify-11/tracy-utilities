<template>
  <div class="app-container">
    <router-view></router-view>
  </div>
</template>

<style>
@import './assets/theme.css';

/* Reset and base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Set variables at the highest level */
:root {
  color-scheme: light dark; /* Enable system color scheme awareness */
}

/* Ensure full height and background inheritance */
html, 
body, 
#app,
.app-container {
  min-height: 100dvh;
  width: 100%;
  margin: 0;
  padding: 0;
}

html {
  background-color: var(--background-color);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  background-color: var(--background-color);
}

.app-container {
  background-color: var(--background-color);
  color: var(--text-primary);
}

/* Global button styles */
button {
  font-size: var(--font-base);
  border-radius: var(--radius-base);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Global input styles */
input, select {
  font-size: var(--font-base);
  border-radius: var(--radius-base);
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-primary);
  padding: var(--spacing-sm);
}

input::placeholder {
  color: var(--text-tertiary);
}
</style>
