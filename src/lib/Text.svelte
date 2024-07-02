<script>
    import Grid from "./Grid.svelte";

    export let featureMap;
    export let run;
    export let selectedTokIdx = null;
    export let selectedFeature = null;

    $: text = (run.response && run.response[0]) || [];
    $: console.log({ text });

    function formatText(element) {
        return element[0].replace(/\n/g, "<br>");
    }

    function strengthOf(element, featureId) {
        return element[1][featureId] || 0;
    }

    function getBackgroundColor(strength) {
        const intensity = Math.min(Math.abs(strength / 10) * 255, 255);
        return strength > 0
            ? `rgba(0, 255, 0, ${intensity / 255})`
            : `rgba(255, 0, 0, ${intensity / 255})`;
    }

    function handleHover(index) {
        selectedTokIdx = index;
    }

    function handleMouseLeave() {
        selectedTokIdx = null;
    }
</script>

<div class="flex flex-col md:flex-row gap-8 p-4 max-w-7xl mx-auto">
  <div class="w-full md:w-1/2">
    <h2 class="text-2xl font-bold mb-4">Text</h2>
    <div class="text-content bg-gray-100 p-4 rounded-md">
      {#each text as element, index}
        <span
          class="transition-colors duration-300 ease-in-out {selectedTokIdx === index ? 'border-2 border-black' : ''}"
          style="background-color: {selectedFeature !== null
            ? getBackgroundColor(strengthOf(element, selectedFeature))
            : 'transparent'};"
          on:mouseenter={() => handleHover(index)}
          on:mouseleave={handleMouseLeave}
        >{@html formatText(element)}</span>
      {/each}
    </div>
  </div>

  <div class="w-full md:w-1/2">
    <h2 class="text-2xl font-bold mb-4">Feature Grid</h2>
    <Grid {text} bind:selectedTokIdx {featureMap} bind:selectedFeature />
  </div>
</div>

<style>
  .text-content {
    max-width: 100%;
    overflow-wrap: break-word;
  }
</style>
