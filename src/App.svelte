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

<main class="min-h-screen bg-gray-50 py-8">
  <div class="w-full px-4">
    <h1 class="text-3xl font-bold mb-6">Feature Visualization</h1>
    
    <div class="mb-8">
      <label for="run-select" class="block text-sm font-medium text-gray-700 mb-2">Select a run:</label>
      <select
        id="run-select"
        bind:value={selectedRun}
        class="block w-full max-w-md px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value={null}>Select a run</option>
        {#each runs as run}
          <option value={run.id} disabled={!run.ready}>{run.prompt.slice(0, 40) || run.id}</option>
        {/each}
      </select>
    </div>

    {#if runData && featureMap}
      <Text run={runData} {featureMap}></Text>
    {/if}
  </div>
</main>
