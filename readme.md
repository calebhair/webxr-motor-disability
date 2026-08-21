# WebXR Tremor Simulation

A WebXR based empathy tool to allow developers to experience their websites with a motor tremor.

In theory, so long as your headset supports WebXR hand tracking, you can try this project.

## Features

- View any website or search the Internet on a virtual mobile device.
- Customisable tremor (in amplitude and frequency).
- Calibration system to allow aligning the virtual mobile with a real object (such as the back of a phone,
or ideally a clear object, like perspex) for enhanced immersion.
- (WIP) Data collection system, where users are prompted to explore their website and are scored based
on how easily they were able to use the website with the tremor.

## Current main limitations

- The browser currently doesn't handle:
  - opening pages in new tabs
  - multi-touch interaction
  - alert/confirm/prompt
  - video/audio fullscreen
  - file picker, download, or permission prompts
  - week input
- Interaction with the phone is limited to the index finger
- Device screen is blurry in VR

## Structure
Two components:
- Streamed Browser Server (SBS); provides Chrome web browsers that can be controlled and stream via socket.io.
This is to allow an interactable browser to be displayed as a texture in an immersive environment. This is implemented in Node v24.18.0.
- The client server, which simply serves the frontend client to the headset.

On entering immersive XR on the headset, a mesh and a socket.io connection is created; the browser streams frames to a texture on the mesh, and touch interactions are passed back to the SBS.

## Setup
> The expected use case is self hosting the SBS and client server on a device on the same LAN as the headset.

1. Clone the repository.

2. In the project directory, with `npm` (or your preferred alternative):

```shell
npm i
```

3. You'll need to know your LAN IP that your headset can find. Some command that can help:
```shell
ifconfig # On unix
ipconfig # On Windows
```

4. Immersive XR requires HTTPS; for self-hosting, you can use [mkcert](https://github.com/filosottile/mkcert):
```shell
mkcert localhost $IP
```
The above command will make a certificate for both localhost and your IP;
localhost is a nice-to-have and keeps naming consistent, so there's less to configure.

5. In `webxr-motor-disability-config.ts`, update HOST_IP, and optionally the CERT and KEY paths if you chose to 
generate your certificate a different way.
```typescript
const HOST_IP = 'your IP here';
```

6. Finally, to start:
```shell
npm start
```