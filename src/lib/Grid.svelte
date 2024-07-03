<script>
    export let featureMap;
    export let text = [];

    let selectedTokIdx = null;
    let selectedFeature = null;
    let size = 5;
    let token_min_seen_qty = 3;
    let min_strength = 3.0;
    let uniq_features = [];
    let count_features = {};
    let isVertical = false;
    let histogram;

    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    $: console.log({ text });

    $: strong_features = text
        .map(([tok, fs]) =>
            Object.entries(fs)
                .filter(([fid, strength]) => strength >= min_strength)
                .map(([fid, strength]) => fid),
        )
        .flat();
    $: [uniq_features, count_features] = strong_features.reduce(
        ([uniq, count], feature) => {
            if (!uniq.includes(feature)) {
                uniq.push(feature);
            }
            count[feature] = (count[feature] || 0) + 1;
            return [uniq, count];
        },
        [[], {}],
    );
    $: filtered_features = uniq_features.filter(
        (feature) => count_features[feature] >= token_min_seen_qty,
    );

    $: histogram =
        selectedFeature && calculate_histogram(selectedFeature, text);

    function calculate_histogram(feature, text) {
        let bins = 20;
        let strengths = text
            .map(([tok, fs]) => fs[feature] || 0)
            .filter((s) => s > 0);
        let max_strength = Math.max(...strengths);
        let min_strength = Math.min(...strengths);
        let bin_size = (max_strength - min_strength) / bins;
        let histogram = strengths.reduce((acc, strength) => {
            let bin = Math.floor((strength - min_strength) / bin_size);
            acc[bin] = (acc[bin] || 0) + 1;
            return acc;
        }, {});

        histogram.min = min_strength;
        histogram.max = max_strength;
        histogram.bin_size = bin_size;
        histogram.max_count = Math.max(...Object.values(histogram));
        return histogram;
    }

    function getColor(feature, strength) {
        const hash = feature
            .toString()
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = (hash * 137.5) % 360;
        const saturation = 70 + (hash % 30);
        const lightness = Math.max(40, Math.min(80, 50 + strength * 2));
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    const formatText = (element) => element[0].replace(/\n/g, "<br>");

    const strengthOf = (element, featureId) => element[1][featureId] || 0;

    function getBackgroundColor(strength) {
        const intensity = Math.min(Math.abs(strength / 10), 1);
        return strength > 0
            ? `rgba(0, 255, 0, ${intensity})`
            : `rgba(255, 0, 0, ${intensity})`;
    }

    function handleKeydown(event) {
        if (!event.shiftKey) return;
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const currentIndex = filtered_features.indexOf(selectedFeature);
            if (currentIndex !== -1) {
                const newIndex =
                    event.key === "ArrowUp"
                        ? (currentIndex - 1 + filtered_features.length) %
                          filtered_features.length
                        : (currentIndex + 1) % filtered_features.length;
                selectedFeature = filtered_features[newIndex];
            } else if (filtered_features.length > 0) {
                selectedFeature = filtered_features[0];
            }
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            if (selectedTokIdx !== null) {
                selectedTokIdx =
                    event.key === "ArrowLeft"
                        ? (selectedTokIdx - 1 + text.length) % text.length
                        : (selectedTokIdx + 1) % text.length;
            } else {
                selectedTokIdx =
                    event.key === "ArrowLeft" ? text.length - 1 : 0;
            }
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed top-0 left-0 right-0 bg-white shadow-md z-10 p-4">
    <div class="flex flex-wrap items-center gap-4 max-w-7xl mx-auto">
        <button
            on:click={() => (isVertical = !isVertical)}
            title="Token direction"
        >
            {isVertical ? "⬇️" : "️➡️"}
        </button>
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
                <label
                    for="size-input"
                    class="text-sm font-medium text-gray-700">Grid Size:</label
                >
                <input
                    type="number"
                    id="size-input"
                    min="1"
                    max="10"
                    bind:value={size}
                    class="w-16 px-2 py-1 border rounded"
                />
            </div>
            <div class="flex items-center gap-2">
                <label
                    for="min-strength-input"
                    class="text-sm font-medium text-gray-700"
                    >Min Strength:</label
                >
                <input
                    type="number"
                    id="min-strength-input"
                    min="0"
                    max="20"
                    step="0.1"
                    bind:value={min_strength}
                    class="w-16 px-2 py-1 border rounded"
                />
            </div>
            <div class="flex items-center gap-2">
                <label
                    for="min-seen-input"
                    class="text-sm font-medium text-gray-700">Min Seen:</label
                >
                <input
                    type="number"
                    id="min-seen-input"
                    min="1"
                    max="10"
                    bind:value={token_min_seen_qty}
                    class="w-16 px-2 py-1 border rounded"
                />
            </div>
        </div>
        {#if selectedFeature}
            <div class="flex items-center gap-4">
                {#if histogram}
                    <svg width={100} height={40}>
                        {#each Object.entries(histogram) as [bin, count]}
                            {@const x =
                                (Number(bin) / Object.keys(histogram).length) *
                                100}
                            {@const height = (count / histogram.max_count) * 40}
                            <rect
                                {x}
                                y={40 - height}
                                width={100 / Object.keys(histogram).length}
                                {height}
                                fill="steelblue"
                            >
                                <title
                                    >Strength: {(
                                        Number(bin) * histogram.bin_size +
                                        histogram.min
                                    ).toFixed(2)}, Count: {count}</title
                                >
                            </rect>
                        {/each}
                    </svg>
                {/if}
                <div class="flex flex-col max-w-[300px]">
                    <p class="text-sm font-medium text-gray-700">
                        Feature:
                        <a
                            href="https://www.neuronpedia.org/gemma-2b/6-res-jb/{selectedFeature}"
                            target="_blank"
                            class="text-blue-600 hover:underline inline-flex items-center"
                        >
                            <img
                                src="https://www.neuronpedia.org/favicon.ico"
                                alt="Neuronpedia favicon"
                                class="w-4 h-4 mr-1"
                            />
                            {selectedFeature}
                        </a>
                    </p>
                    <p
                        class="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                        {featureMap[selectedFeature]}
                    </p>
                </div>
            </div>
        {/if}
    </div>
</div>

<div class="mt-24 flex flex-col items-center w-full">
    <div class="w-full flex flex-col md:flex-row gap-8">
        <div class="w-full md:w-1/3">
            <h2 class="text-2xl font-bold mb-4">
                Text <button on:click={() => dispatch("switchText")}>
                    📝
                </button>
            </h2>
            <div class="text-content bg-gray-100 p-4 rounded-md">
                {#each text as element, index}
                    <span
                        class="transition-colors duration-300 ease-in-out {selectedTokIdx ===
                        index
                            ? 'border-2 border-black'
                            : ''}"
                        style="background-color: {selectedFeature !== null
                            ? getBackgroundColor(
                                  strengthOf(element, selectedFeature),
                              )
                            : 'transparent'};"
                        on:mouseenter={() => (selectedTokIdx = index)}
                        on:mouseleave={() => (selectedTokIdx = null)}
                        >{@html formatText(element)}</span
                    >
                {/each}
            </div>
        </div>
        <div class="w-full md:w-2/3">
            <h2 class="text-2xl font-bold mb-4">Feature Grid</h2>
            <svg
                width={isVertical
                    ? (filtered_features.length * size) 
                    : (text.length * size)}
                height={isVertical
                    ? (text.length * size) 
                    : (filtered_features.length * size)}
                class="border border-gray-300 rounded-md w-full p-2"
            >
                {#if selectedFeature}
                    <rect
                        x={isVertical
                            ? (filtered_features.indexOf(selectedFeature) *
                                  size) 
                            : 0}
                        y={isVertical
                            ? 0
                            : (filtered_features.indexOf(selectedFeature) *
                                  size)}
                        width={isVertical ? size : (text.length * size)}
                        height={isVertical
                            ? (text.length * size) 
                            : size}
                        fill="hsl(0, 0%, 95%)"
                    />
                {/if}
                {#if selectedTokIdx}
                    <rect
                        x={isVertical ? 0 : (selectedTokIdx * size)}
                        y={isVertical ? (selectedTokIdx * size) : 0}
                        width={isVertical
                            ? (filtered_features.length * size) 
                            : size}
                        height={isVertical
                            ? size
                            : (filtered_features.length * size)}
                        fill="hsl(0, 0%, 95%)"
                    />
                {/if}
                {#each text as [tok, features], textIdx}
                    {#each filtered_features as feature, featIdx}
                        {@const strength = features[feature] || 0}
                        {#if strength > 0}
                            <rect
                                role="cell"
                                tabindex="0"
                                x={isVertical
                                    ? (featIdx * size) 
                                    : (textIdx * size)}
                                y={isVertical
                                    ? (textIdx * size) 
                                    : (featIdx * size)}
                                width={size}
                                height={size}
                                fill={getColor(feature, strength)}
                                aria-label={`Feature ${feature} for token ${tok} with strength ${strength}`}
                                on:focus={() => {
                                    selectedTokIdx = textIdx;
                                    selectedFeature = feature;
                                }}
                                on:mouseenter={(event) => {
                                    if (event.shiftKey) {
                                        selectedTokIdx = textIdx;
                                        selectedFeature = feature;
                                    }
                                }}
                            >
                            </rect>
                        {/if}
                    {/each}
                {/each}
            </svg>
        </div>
    </div>
</div>

<style>
    .text-content {
        max-width: 100%;
        overflow-wrap: break-word;
    }
</style>
