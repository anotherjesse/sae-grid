<script>
    import Grid from './Grid.svelte';

    export let featureMap;
    export let run;
    export let selectedTokIdx = null;
    export let selectedFeature = null;

    $: text = run.response && run.response[0] || [];
    $:console.log({text})

    function formatText(element) {
        return element[0].replace(/\n/g, '<br>');
    }

    function strengthOf(element, featureId) {
        return element[1][featureId] || 0;
    }

    function getBackgroundColor(strength) {
        const intensity = Math.min(Math.abs(strength / 10) * 255, 255);
        return strength > 0 ? `rgba(0, 255, 0, ${intensity / 255})` : `rgba(255, 0, 0, ${intensity / 255})`;
    }

    function handleHover(index) {
        selectedTokIdx = index;
    }

    function handleMouseLeave() {
        selectedTokIdx = null;
    }
</script>

<div class="flex">
    <div class="text flex-1">
        {#each text as element, index}
            <span
                class:selected={selectedTokIdx === index}
                style="background-color: {selectedFeature !== null ? getBackgroundColor(strengthOf(element, selectedFeature)) : 'transparent'};"
                on:mouseenter={() => handleHover(index)}
                on:mouseleave={handleMouseLeave}
            >{@html formatText(element)}</span>
        {/each}
    </div>

    <div class="flex-1">
        <Grid text={text} bind:selectedTokIdx featureMap={featureMap} bind:selectedFeature />
    </div>
</div>

<style>
    .selected {
        border: 2px solid black;
        padding: -2px
    }

    .text {
        max-width: 400px;
        overflow-wrap: break-word;
        margin-top: 50px;
    }

    .text span {
        transition: background-color 0.3s ease;
    }
</style>