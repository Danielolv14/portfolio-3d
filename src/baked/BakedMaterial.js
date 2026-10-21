// Material do quarto assado no Blender (docs/plano/02-pipeline-blender.md, seção 9).
// Cada objeto usa a própria textura original (nítida, no UV das texturas). A luz difusa vem do bake
// (num atlas, no segundo UV) e o reflexo vem de um mapa do próprio quarto (scene.environment, ver
// BakedRoom): é o reflexo que tira o aspecto de "massinha" (piso, cromado, vidro).
// A base é o MeshStandardMaterial (rugosidade, metal e reflexo de verdade) com lightMap; trocamos:
//  - a luz do lightMap por: luz de dia e de noite misturadas por uNight + máscara de LEDs
//    (R = luminária da cabeceira, G = luminária da TV, B = RGB do gabinete), com cor e potência;
//  - tiramos a luz difusa do mapa de ambiente (ela já está no bake; contaria duas vezes).
// As texturas de luz vêm codificadas em 8 bits: valor = (luz / escala)^(1/2,2).
import * as THREE from 'three';

const PARS = /* glsl */ `
uniform sampler2D lightNight;
uniform sampler2D ledMask;
uniform float scaleDay;
uniform float scaleNight;
uniform vec3 scaleLeds;
uniform vec3 ledColor[3];
uniform vec3 ledPower;
uniform float uNight;
uniform float uExposure;
`;

// Irradiância = luz assada × π (o three divide por π no difuso: BRDF_Lambert)
const LIGHT = /* glsl */ `
vec3 lmDay = pow(lightMapTexel.rgb, vec3(2.2)) * scaleDay;
vec3 lmNight = pow(texture2D(lightNight, vLightMapUv).rgb, vec3(2.2)) * scaleNight;
vec3 leds = pow(texture2D(ledMask, vLightMapUv).rgb, vec3(2.2)) * scaleLeds * ledPower;
vec3 lightMapIrradiance = (mix(lmDay, lmNight, uNight) + leds.r * ledColor[0] + leds.g * ledColor[1] + leds.b * ledColor[2]) * uExposure * PI;
`;

const LIGHTS_CHUNK = THREE.ShaderChunk.lights_fragment_maps
    .replace('vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;', LIGHT)
    .replace('iblIrradiance += getIBLIrradiance( geometryNormal );', '');

// Uniforms que mudam a cada quadro e valem para o quarto todo (o mesmo objeto em todos os materiais)
export function createSharedUniforms(ledColors) {
    return {
        uNight: { value: 0 },
        uExposure: { value: 1 },
        ledPower: { value: new THREE.Vector3() },
        ledColor: { value: ledColors.map((c) => new THREE.Color(...c)) }
    };
}

// `original`: o material que veio do GLB (cor, textura, cor por vértice, rugosidade, metal).
// `group`: as texturas de luz e as escalas do grupo de atlas dele.
export function createBakedMaterial(original, group, shared) {
    const material = new THREE.MeshStandardMaterial({
        name: original.name,
        color: original.color,
        map: original.map,
        vertexColors: original.vertexColors,
        side: original.side,
        roughness: original.roughness ?? 0.8,
        metalness: original.metalness ?? 0,
        roughnessMap: original.roughnessMap,
        metalnessMap: original.metalnessMap,
        lightMap: group.lightDay
    });
    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, shared, {
            lightNight: { value: group.lightNight },
            ledMask: { value: group.ledMask },
            scaleDay: { value: group.scaleDay },
            scaleNight: { value: group.scaleNight },
            scaleLeds: { value: new THREE.Vector3(...group.scaleLeds) }
        });
        shader.fragmentShader = PARS + shader.fragmentShader.replace('#include <lights_fragment_maps>', LIGHTS_CHUNK);
    };
    return material;
}
