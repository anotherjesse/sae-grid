<script>
    export let text;
    export let selectedTokIdx;
    export let featureMap;
    export let selectedFeature;
    let size = 3;
    let token_min_seen_qty = 1;
    let min_strength = 20.0;
    let uniq_features = [];
    let count_features = {};
    let isVertical = false;
  
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
  
    function getColor(feature, strength) {
      const hue = Math.abs(hashCode(feature.toString()) % 360);
      const saturation = "100";
      const value = 100 * (strength / 20);
  
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
        <input type="range" id="size-slider" min="1" max="10" bind:value={size} />
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
          <p>Feature: {selectedFeature}</p>
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
        x={isVertical ? filtered_features.indexOf(selectedFeature) * size : 0}
        y={isVertical ? 0 : filtered_features.indexOf(selectedFeature) * size}
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
            on:mouseenter={() => {
              selectedTokIdx = textIdx;
              selectedFeature = feature;
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
    }
    .sliders > div {
      display: flex;
      flex-direction: column;
    }
    svg {
      margin-top: 50px;
    }
  </style>
  