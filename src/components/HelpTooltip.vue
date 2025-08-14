<!-- src/components/HelpTooltip.vue -->
<template>
  <span
          class="htp-root"
          tabindex="0"
          aria-haspopup="true"
          aria-expanded="false"
  >
    ?
    <span class="htp-box" role="tooltip">
      <slot>
        <!-- Fallback: render Message with \n as real line breaks -->
        <span class="htp-fallback">{{ Message }}</span>
      </slot>
    </span>
  </span>
</template>

<script setup>
    defineProps({
        // Optional fallback text (used only if no slot content is provided)
        Message: {
            type: String,
            default: ''
        }
    })
</script>

<style scoped>
  /* Root trigger “?” bubble */
  .htp-root {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    margin-left: 8px;
    width: 1.6em;
    height: 1.6em;
    border-radius: 50%;
    background: #e53935;
    color: #fff;
    font-weight: 700;
    font-size: 1em;
    cursor: help;
    user-select: none;
    box-shadow: 0 0 4px rgba(0,0,0,.2);
    outline: none;
  }

  /* Tooltip panel (hidden by default) */
  .htp-box {
    position: absolute;
    top: 125%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;

    background: #333;
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    min-width: 260px;
    max-width: 420px;
    font-size: .95rem;
    line-height: 1.35;
    box-shadow: 0 2px 6px rgba(0,0,0,.3);
    text-align: left;

    /* Hide */
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .15s ease, visibility .15s ease;
  }

  /* Arrow */
  .htp-box::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: transparent transparent #333 transparent;
  }

  /* Show on hover or keyboard focus */
  .htp-root:hover .htp-box,
  .htp-root:focus .htp-box,
  .htp-root:focus-within .htp-box {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  /* Respect \n in Message fallback */
  .htp-fallback {
    white-space: pre-line;
  }
</style>