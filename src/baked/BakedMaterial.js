// Material do quarto assado no Blender (docs/plano/02-pipeline-blender.md, seção 9).
// Não calcula luz: a cor de cada ponto é albedo × luz assada. A luz de dia e a de noite são
// misturadas por uNight (0 = dia, 1 = noite). As texturas de luz vêm codificadas em 8 bits:
// valor = (luz / escala)^(1/2,2); aqui desfazemos com valor^2,2 × escala.
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
uniform float scaleDay;
uniform float scaleNight;
uniform float uNight;
uniform float uExposure;
varying vec2 vUv;

vec3 decodeLight(sampler2D map, float scale) {
    return pow(texture2D(map, vUv).rgb, vec3(2.2)) * scale;
}

void main() {
    vec3 albedo = texture2D(albedoMap, vUv).rgb;
    vec3 light = mix(decodeLight(lightDay, scaleDay), decodeLight(lightNight, scaleNight), uNight);
    gl_FragColor = vec4(albedo * light * uExposure, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export function createBakedMaterial({ albedo, lightDay, lightNight, scaleDay, scaleNight }) {
    return new THREE.ShaderMaterial({
        uniforms: {
            albedoMap: { value: albedo },
            lightDay: { value: lightDay },
            lightNight: { value: lightNight },
            scaleDay: { value: scaleDay },
            scaleNight: { value: scaleNight },
            uNight: { value: 0 },
            uExposure: { value: 1 }
        },
        vertexShader,
        fragmentShader
    });
}
