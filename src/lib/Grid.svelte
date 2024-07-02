<script>
    export let text;
    export let selectedTokIdx;
    export let featureMap;
    export let selectedFeature;
    let size = 3;
    let token_min_seen_qty = 3;
    let min_strength = 3.0;
    let uniq_features = [];
    let count_features = {};
    let isVertical = false;
    let histogram;

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
        let strengths = text.map(([tok, fs]) => fs[feature] || 0).filter(s => s > 0);
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

    $: console.log({ histogram });

    function getColor(feature, strength) {
        const hue = Math.abs(hashCode(feature.toString()) % 360);
        const saturation = "100";
        const value = Math.max(50 * (strength / 20), 50);

        return `hsl(${hue}, ${saturation}%, ${value}%)`;
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash;
    }
</script>

<div class="sliders-container">
    <div class="sliders">
        <div>
            <button on:click={() => (isVertical = !isVertical)}>
                {isVertical ? "🔽" : "➡️"}
            </button>
        </div>
        <div>
            <label for="size-slider">Grid Size: {size}</label>
            <input
                type="range"
                id="size-slider"
                min="1"
                max="10"
                bind:value={size}
            />
        </div>
        <div>
            <label for="min-strength-slider"
                >Min Feature Strength: {min_strength}</label
            >
            <input
                type="range"
                id="min-strength-slider"
                min="0"
                max="20"
                bind:value={min_strength}
            />
        </div>
        <div>
            <label for="min-seen-slider"
                >Min Times Feature Seen: {token_min_seen_qty}</label
            >
            <input
                type="range"
                id="min-seen-slider"
                min="1"
                max="10"
                bind:value={token_min_seen_qty}
            />
        </div>
        <div>
            {#if selectedFeature}
                <p>
                    Feature:
                    <a
                        href="https://www.neuronpedia.org/gemma-2b/6-res-jb/{selectedFeature}"
                        target="_blank">{selectedFeature}</a
                    >
                </p>
                <p>{featureMap[selectedFeature]}</p>
            {/if}
        </div>
    </div>
</div>

<svg
    width={isVertical ? filtered_features.length * size : text.length * size}
    height={isVertical ? text.length * size : filtered_features.length * size}
>
    {#if selectedFeature}
        <rect
            x={isVertical
                ? filtered_features.indexOf(selectedFeature) * size
                : 0}
            y={isVertical
                ? 0
                : filtered_features.indexOf(selectedFeature) * size}
            width={isVertical ? size : text.length * size}
            height={isVertical ? text.length * size : size}
            fill="hsl(0, 0%, 95%)"
        />
    {/if}
    {#if selectedTokIdx}
        <rect
            x={isVertical ? 0 : selectedTokIdx * size}
            y={isVertical ? selectedTokIdx * size : 0}
            width={isVertical ? filtered_features.length * size : size}
            height={isVertical ? size : filtered_features.length * size}
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
                    x={isVertical ? featIdx * size : textIdx * size}
                    y={isVertical ? textIdx * size : featIdx * size}
                    width={size}
                    height={size}
                    fill={getColor(feature, strength)}
                    aria-label={`Feature ${feature} for token ${tok} with strength ${strength}`}
                    on:mouseenter={(event) => {
                        if (event.shiftKey) {
                            selectedTokIdx = textIdx;
                            selectedFeature = feature;
                        }
                    }}
                    on:focus={() => {
                        selectedTokIdx = textIdx;
                        selectedFeature = feature;
                    }}
                >
                </rect>
            {/if}
        {/each}
    {/each}
</svg>

{#if histogram}
    <svg width={400} height={240}>
        <g transform="translate(50, 10)">
            <!-- Y-axis -->
            <line x1="0" y1="0" x2="0" y2="180" stroke="black" />
            {#each Array(5) as _, i}
                <line x1="-5" y1={i * 45} x2="0" y2={i * 45} stroke="black" />
                <text x="-10" y={180 - i * 45 + 5} text-anchor="end" font-size="10">
                    {Math.round((histogram.max_count / 4) * i)}
                </text>
            {/each}
            
            <!-- X-axis -->
            <line x1="0" y1="180" x2="320" y2="180" stroke="black" />
            {#each Array(6) as _, i}
                {@const value = histogram.min + (histogram.max - histogram.min) * (i / 5)}
                <line x1={i * 64} y1="180" x2={i * 64} y2="185" stroke="black" />
                <text x={i * 64} y="200" text-anchor="middle" font-size="10">
                    {value.toFixed(2)}
                </text>
            {/each}
            
            <!-- Bars -->
            {#each Object.entries(histogram) as [bin, count]}
                {@const x = (Number(bin) * histogram.bin_size) / (histogram.max - histogram.min) * 320}
                {@const height = (count / histogram.max_count) * 180}
                <rect
                    x={x}
                    y={180 - height}
                    width={320 / Object.keys(histogram).length}
                    height={height}
                    fill="steelblue"
                />
            {/each}
        </g>
        
        <!-- Labels -->
        <text x="210" y="230" text-anchor="middle">Feature Strength</text>
        <text x="15" y="110" text-anchor="middle" transform="rotate(-90, 15, 110)">Frequency</text>
    </svg>
{/if}

<style>
    .sliders-container {
        position: fixed;
        top: 0;
        left: 400px;
        right: 0;
        background-color: white;
        z-index: 1000;
        padding: 1rem;
    }
    .sliders {
        display: flex;
        gap: 1rem;
        font-size: 12px;
    }
    .sliders > div {
        display: flex;
        flex-direction: column;
    }
    svg {
        margin-top: 50px;
    }
</style>
