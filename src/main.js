import { createApp } from 'vue';
import App from './App.vue';
import AppIcon from './components/common/AppIcon.vue';
import './assets/styles/main.css';

const app = createApp(App);
app.component('AppIcon', AppIcon);
app.mount('#app');
