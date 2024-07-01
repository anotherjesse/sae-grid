<script>
  import "./app.css";
  import { onMount } from "svelte";
  import Text from "./lib/Text.svelte";
  let featureMap = {};
  let runs = [];
  let selectedRun = null;
  let runData = {};

  onMount(async () => {
    await Promise.all([loadFeatureMap(), loadRuns()]);
    // Load run from URL hash if present
    const hashRun = window.location.hash.slice(1);
    if (hashRun && runs.some(run => run.id === hashRun)) {
      selectedRun = hashRun;
    }
  });

  async function loadFeatureMap() {
    const response = await fetch("./data/autointerp.json");
    const rawData = await response.json();
    featureMap = Object.fromEntries(rawData.map(([desc, key]) => [key, desc]));
  }

  async function loadRuns() {
    const response = await fetch("./data/index.json");
    let allRuns = await response.json();
    runs = allRuns.filter((run) => run.prompt);

    if (runs.length > 0 && !selectedRun) {
      selectedRun = runs[0].id;
    }
  }

  async function loadRunData() {
    const response = await fetch(`./data/${selectedRun}.json`);
    runData = await response.json();
    // Update URL hash when run is loaded
    window.location.hash = selectedRun;
  }

  // Listen for hash changes
  function handleHashChange() {
    const hashRun = window.location.hash.slice(1);
    if (hashRun && runs.some(run => run.id === hashRun)) {
      selectedRun = hashRun;
    }
  }

  onMount(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  });

  $: if (selectedRun) {
    loadRunData();
  }
</script>

<svelte:head>
  <title>Client-Side Only Page</title>
</svelte:head>

<h2>Runs:</h2>
<select bind:value={selectedRun}>
  <option value={null}>Select a run</option>
  {#each runs as run}
    <option value={run.id} disabled={!run.ready}
      >{run.prompt.slice(0, 40) || run.id}</option
    >
  {/each}
</select>

{#if runData && featureMap}
  <Text run={runData} {featureMap}></Text>
{/if}
