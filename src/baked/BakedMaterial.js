// Material do quarto assado no Blender (docs/plano/02-pipeline-blender.md, seção 9).
// Não calcula luz: a cor de cada ponto é albedo × luz assada. A luz de dia e a de noite são
// misturadas por uNight (0 = dia, 1 = noite). As texturas de luz vêm codificadas em 8 bits:
// valor = (luz / escala)^(1/2,2); aqui desfazemos com valor^2,2 × escala.
// Máscara de LEDs: a luz de cada fonte ajustável (R = luminária da cabeceira, G = luminária da TV,
// B = RGB do gabinete), assada sozinha e branca. Aqui ela ganha cor e potência: dá para acender,
// apagar e trocar a cor ao vivo, e a luz rebatida acompanha.
import * as THREE from 'three';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D albedoMap;
uniform sampler2D lightDay;
uniform sampler2D lightNight;
uniform sampler2D ledMask;
uniform float scaleDay;
uniform float scaleNight;
uniform vec3 scaleLeds;
uniform vec3 ledColor[3];
uniform vec3 ledPower;
uniform float uNight;
uniform float uExposure;
varying vec2 vUv;

vec3 decode(sampler2D map, float scale) {
    return pow(texture2D(map, vUv).rgb, vec3(2.2)) * scale;
}

void main() {
    vec3 albedo = texture2D(albedoMap, vUv).rgb;
    vec3 light = mix(decode(lightDay, scaleDay), decode(lightNight, scaleNight), uNight);
    vec3 leds = pow(texture2D(ledMask, vUv).rgb, vec3(2.2)) * scaleLeds * ledPower;
    light += leds.r * ledColor[0] + leds.g * ledColor[1] + leds.b * ledColor[2];
    gl_FragColor = vec4(albedo * light * uExposure, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export function createBakedMaterial({ albedo, lightDay, lightNight, ledMask, scaleDay, scaleNight, scaleLeds, ledColors }) {
    return new THREE.ShaderMaterial({
        uniforms: {
            albedoMap: { value: albedo },
            lightDay: { value: lightDay },
            lightNight: { value: lightNight },
            ledMask: { value: ledMask },
            scaleDay: { value: scaleDay },
            scaleNight: { value: scaleNight },
            scaleLeds: { value: new THREE.Vector3(...scaleLeds) },
            ledColor: { value: ledColors.map((c) => new THREE.Color(...c)) },
            ledPower: { value: new THREE.Vector3() },
            uNight: { value: 0 },
            uExposure: { value: 1 }
        },
        vertexShader,
        fragmentShader
    });
}
