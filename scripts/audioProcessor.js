(function() {
  if (window.noiseSuppressorInitialized) {
    return;
  }
  window.noiseSuppressorInitialized = true;

  let audioContext;
  let sourceNode;
  let suppressorNode;
  let destinationNode;
  let isSuppressionEnabled = false;

  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  // Intercept the browser's request to get microphone access
  navigator.mediaDevices.getUserMedia = async function(constraints) {
    const stream = await originalGetUserMedia(constraints);

    if (constraints.audio) {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Create a new stream to avoid modifying the original one directly
      destinationNode = audioContext.createMediaStreamDestination();
      sourceNode = audioContext.createMediaStreamSource(stream);

      // Initially connect the source directly to the destination
      sourceNode.connect(destinationNode);

      // Replace the original audio track with our processed one
      const processedTrack = destinationNode.stream.getAudioTracks()[0];
      const originalTrack = stream.getAudioTracks()[0];
      stream.removeTrack(originalTrack);
      stream.addTrack(processedTrack);

      // Check the initial state and apply suppression if needed
      chrome.storage.local.get("suppressionEnabled", ({ suppressionEnabled }) => {
        if (suppressionEnabled) {
          toggleSuppression(true);
        }
      });
    }

    return stream;
  };

  async function toggleSuppression(enable) {
    if (!audioContext || !sourceNode) return;

    if (enable === isSuppressionEnabled) return;

    if (enable) {
      // Load the audio worklet and WASM module
      if (!suppressorNode) {
        try {
          await audioContext.audioWorklet.addModule(chrome.runtime.getURL('scripts/rnnoise.js'));
          const wasm = await fetch(chrome.runtime.getURL('scripts/rnnoise.wasm'));
          const wasmModule = await WebAssembly.compileStreaming(wasm);

          suppressorNode = new AudioWorkletNode(audioContext, 'rnnoise-processor', {
            processorOptions: {
              wasmModule,
              numberOfChannels: 1
            }
          });
        } catch (error) {
          console.error("Failed to load noise suppressor:", error);
          return;
        }
      }
      // Reroute the audio graph: source -> suppressor -> destination
      sourceNode.disconnect();
      sourceNode.connect(suppressorNode);
      suppressorNode.connect(destinationNode);
      console.log("Noise suppression enabled.");
    } else {
      // Reroute back to the original: source -> destination
      if (suppressorNode) {
        sourceNode.disconnect();
        suppressorNode.disconnect();
        sourceNode.connect(destinationNode);
      }
      console.log("Noise suppression disabled.");
    }
    isSuppressionEnabled = enable;
  }

  // Listen for control messages from the content script
  window.addEventListener("message", (event) => {
    if (event.source === window && event.data && event.data.type === "NOISE_SUPPRESSOR_CONTROL") {
      toggleSuppression(event.data.enabled);
    }
  });
})();