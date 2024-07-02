<script>
  import "./app.css";
  import { onMount } from "svelte";
  import Grid from "./lib/Grid.svelte";
  let featureMap = {};
  let runs = [];
  let selectedRun = null;
  let runData = {};
  let showSelector = false;

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
  <title>SAE Feature Grid</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 py-4">
  <div class="w-full px-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Feature Visualization</h1>
      <div class="relative">
        <button
          on:click={() => showSelector = !showSelector}
          class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Select Run
        </button>
        {#if showSelector}
          <div class="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            <select
              bind:value={selectedRun}
              on:change={() => showSelector = false}
              class="block w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={null}>Select a run</option>
              {#each runs as run}
                <option value={run.id} disabled={!run.ready}>{run.prompt.slice(0, 40) || run.id}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>
    </div>

    {#if runData && featureMap}
      <Grid run={runData} {featureMap}></Grid>
    {/if}
  </div>
</main>
