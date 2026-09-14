# GIF Performance for Revenge

A Revenge Discord Android plugin that keeps GIFs animated while reducing avoidable React Native image rendering work.

## Add to Revenge

Add this repository URL in Revenge's plugin repositories:

```text
https://raw.githubusercontent.com/Lordx679/revenge-gif-performance/main/index.json
```

Then install **GIF Performance** from the repository. If Revenge expects a repository base URL rather than an index URL, use:

```text
https://raw.githubusercontent.com/Lordx679/revenge-gif-performance/main/
```

The plugin is JavaScript-only and cannot control Android's native GIF frame decoder. It removes image fades, requests resized decoding, and enables progressive rendering where supported.
