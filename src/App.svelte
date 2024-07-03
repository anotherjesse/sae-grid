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
    // Load run from URL hash if present, otherwise show selector
    const hashRun = window.location.hash.slice(1);
    if (hashRun && runs.some((run) => run.id === hashRun)) {
      selectedRun = hashRun;
    } else {
      showSelector = true;
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
    if (hashRun && runs.some((run) => run.id === hashRun)) {
      selectedRun = hashRun;
    }
  }

  onMount(() => {
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  });

  $: if (selectedRun) {
    loadRunData();
  }

  function handleSwitchText() {
    showSelector = true;
  }
</script>

<svelte:head>
  <title>SAE Feature Grid</title>
</svelte:head>

{#if runData && featureMap}
  <Grid run={runData} {featureMap} on:switchText={handleSwitchText}></Grid>
{/if}

{#if showSelector}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
      <h2 class="text-xl font-bold mb-4">Select a text</h2>
      <p class="mb-4 text-gray-600">
        Visualize activated SAE features for different text prompts.
      </p>
      <select
        bind:value={selectedRun}
        on:change={() => (showSelector = false)}
        class="block w-full px-3 py-2 mb-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={null}>Select a run</option>
        {#each runs as run}
          <option value={run.id} disabled={!run.ready}
            >{run.prompt.slice(0, 40) || run.id}</option
          >
        {/each}
      </select>
      <div class="flex justify-end">
        <button
          on:click={() => (showSelector = false)}
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
