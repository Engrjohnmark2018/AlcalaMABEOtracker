<template>
  <svg class="app-icon" xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(d, i) in paths[name] || paths.file" :key="i" :d="d" />
  </svg>
</template>
<script setup>
defineProps({name: {type:String,default:'file'},size:{type:[Number,String],default:16}});
const paths = {
  file:['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z','M14 2v6h6','M8 13h8M8 17h5'],
  image:['M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z','M3 16l5-5 4 4 4-6 5 7','M8 7h.01'],
  print:['M6 9V3h12v6','M6 18H3V9h18v9h-3','M6 14h12v7H6Z','M17 12h.01'],
  settings:['M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z','M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
  map:['M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2Z','M9 3v16M15 5v16'],
  chart:['M3 3v18h18','M7 16v-4M12 16V8M17 16V5'],
  package:['M12 3l9 5v10l-9 5-9-5V8Z','M3 8l9 5 9-5M12 13v10M7 5.8l9 5'],
  trash:['M3 6h18M9 6V3h6v3','M5 6l1 15h12l1-15M10 10v7M14 10v7'],
  download:['M12 3v12M7 10l5 5 5-5','M4 16v5h16v-5'],
  upload:['M12 16V3M7 8l5-5 5 5','M4 16v5h16v-5'],
  edit:['M16 3l5 5-12 12-6 1 1-6Z','M14 5l5 5'],
  check:['M5 12l4 4L19 6'],
  warning:['M12 3l10 18H2Z','M12 9v5M12 17h.01'],
  refresh:['M20 7a9 9 0 0 0-15-2L2 8M2 3v5h5','M4 17a9 9 0 0 0 15 2l3-3M22 21v-5h-5'],
  clock:['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z','M12 7v5l3 2'],
  ban:['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z','M6 6l12 12'],
  lock:['M5 10h14v11H5Z','M8 10V6a4 4 0 0 1 8 0v4M12 14v3'],
  unlock:['M5 10h14v11H5Z','M8 10V6a4 4 0 0 1 8 0M12 14v3'],
  sun:['M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z','M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5'],
  moon:['M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z'],
  eye:['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z','M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
  'eye-off':['M3 3l18 18','M10 5c6-1 11 7 11 7l-3 4M6 6l-4 6s3 7 10 7c2 0 4-1 5-2','M10 10a3 3 0 0 0 4 4'],
  key:['M10 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z','M9 11l11 11M15 17l3-3M18 20l3-3'],
  plane:['M22 2l-7 20-4-9-9-4Z','M11 13L22 2'],
  clipboard:['M8 4H4v18h16V4h-4','M8 2h8v5H8Z','M8 12h8M8 16h5'],
  bolt:['M13 2L3 14h8l-1 8 11-12h-8Z'],
  link:['M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2','M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2'],
  user:['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z','M4 21v-2a8 8 0 0 1 16 0v2'],
  calendar:['M3 5h18v16H3Z','M7 3v4M17 3v4M3 10h18M7 14h2M13 14h2M7 18h2'],
  switch:['M3 7h18l-4-4M21 17H3l4 4'],
};
</script>
