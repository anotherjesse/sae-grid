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

<Grid {text} bind:selectedTokIdx {featureMap} bind:selectedFeature {formatText} {strengthOf} {getBackgroundColor} {handleHover} {handleMouseLeave} />
