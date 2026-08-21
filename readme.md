# WebXR Tremor Simulation

A WebXR based empathy tool to allow developers to experience their websites with a motor tremor.

In theory, so long as your headset supports WebXR hand tracking, you can try this project.

## Setup
>The expected use case is self hosting the SBS and client server on a device on the same LAN as the headset.

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
localhost is a nice to have and keeps naming consistent, so there's less to configure.

5. In `webxr-motor-disability-config.ts`, update HOST_IP, and optionally the CERT and KEY paths if you chose to 
generate your certificate a different way.
```typescript
const HOST_IP = '143.117.93.180';
const CERT_PATH = './localhost+1.pem';
const KEY_PATH = './localhost+1-key.pem';
```

Finally, to start:
```shell
npm start
```