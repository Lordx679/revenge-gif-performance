# GIF Performance for Revenge

A Revenge Discord Android plugin that keeps GIFs animated while reducing avoidable React Native image rendering work.

## Add to Revenge

Revenge appends `/index.json/` to repository URLs. Use this GitHub raw redirect endpoint, which accepts that trailing slash and redirects to the manifest:

```text
https://github.com/Lordx679/revenge-gif-performance/raw/refs/heads/main
```

Do not add `index.json` yourself. After adding the repository, install **GIF Performance** and restart Discord.

The plugin is JavaScript-only. It keeps GIF animation enabled, removes image fades, requests resized decoding, and enables progressive rendering where supported. It cannot directly throttle Android's native animated-GIF decoder.
