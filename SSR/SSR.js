geofs["rrt.glsl"] = "" + `
//Using a modified version of the default CesiumJS AO shader for base functions
uniform sampler2D depthTexture;
uniform sampler2D colorTexture;
uniform float intensity;
uniform float bias;
uniform float lengthCap;
uniform float stepSize;
uniform float frustumLength;
uniform int viewType;
uniform bool smoothNormals;
uniform bool isEnabled;
varying vec2 v_textureCoordinates;
#ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
#endif  

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 clipToEye(vec2 uv, float depth)
{
    vec2 xy = vec2((uv.x * 2.0 - 1.0), ((1.0 - uv.y) * 2.0 - 1.0));
    vec4 posEC = czm_inverseProjection * vec4(xy, depth, 1.0);
    posEC = posEC / posEC.w;
    return posEC;
}

vec4 depthToView(vec2 texCoord, float depth) {
    vec4 ndc = vec4(texCoord, depth, 1.0) * 2.0 - 1.0;
    vec4 viewPos = czm_inverseProjection * ndc;
    return viewPos / viewPos.w;
}

vec3 viewToDepth(vec3 pos)
{
  vec4 clip = czm_projection * vec4(pos,1.0);
  vec3 ndc = clip.xyz / clip.w;
  return ndc * .5 + .5;
}

//Reconstruct Normal Without Edge Removation
vec3 getNormalXEdge(vec3 posInCamera, float depthU, float depthD, float depthL, float depthR, vec2 pixelSize)
{
    vec4 posInCameraUp = clipToEye(v_textureCoordinates - vec2(0.0, pixelSize.y), depthU);
    vec4 posInCameraDown = clipToEye(v_textureCoordinates + vec2(0.0, pixelSize.y), depthD);
    vec4 posInCameraLeft = clipToEye(v_textureCoordinates - vec2(pixelSize.x, 0.0), depthL);
    vec4 posInCameraRight = clipToEye(v_textureCoordinates + vec2(pixelSize.x, 0.0), depthR);

    vec3 up = posInCamera.xyz - posInCameraUp.xyz;
    vec3 down = posInCameraDown.xyz - posInCamera.xyz;
    vec3 left = posInCamera.xyz - posInCameraLeft.xyz;
    vec3 right = posInCameraRight.xyz - posInCamera.xyz;

    vec3 DX = length(left) < length(right) ? left : right;
    vec3 DY = length(up) < length(down) ? up : down;

    return normalize(cross(DY, DX));
}

//smooth normals with blur
vec3 recNormals(vec3 pos) {
  float dMp = 0.006 * pos.z; //how far we sample from the original point
  vec3 P0 = depthToView(pos.xy, pos.z).xyz;
  vec3 normal = normalize(cross(dFdx(P0), dFdy(P0)));
  float d1 = czm_readDepth(depthTexture, vec2(pos.x + dMp, pos.y + dMp));
  float d2 = czm_readDepth(depthTexture, vec2(pos.x - dMp, pos.y + dMp));
  float d3 = czm_readDepth(depthTexture, vec2(pos.x + dMp, pos.y - dMp));
  float d4 = czm_readDepth(depthTexture, vec2(pos.x - dMp, pos.y - dMp));
  
  vec3 P1 = depthToView(vec2(pos.x + dMp, pos.y + dMp), d1).xyz;
  vec3 P2 = depthToView(vec2(pos.x - dMp, pos.y + dMp), d2).xyz;
  vec3 P3 = depthToView(vec2(pos.x + dMp, pos.y - dMp), d3).xyz;
  vec3 P4 = depthToView(vec2(pos.x - dMp, pos.y - dMp), d4).xyz;
  vec3 normal1 = normalize(cross(dFdx(P1), dFdy(P1)));
  vec3 normal2 = normalize(cross(dFdx(P2), dFdy(P2)));
  vec3 normal3 = normalize(cross(dFdx(P3), dFdy(P3)));
  vec3 normal4 = normalize(cross(dFdx(P4), dFdy(P4)));
  if(smoothNormals == true) {
  return (normal + normal1 + normal2 + normal3 + normal4) / 5.0;
  } else {
return normal;
  }
}

void main(void)
{
    if (isEnabled == false) {
      gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
      return;
    }
    if (viewType == 1) {
      gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
    return;
    }
    vec4 color;
    vec4 colAtRef;
    float depth1 = czm_readDepth(depthTexture, v_textureCoordinates);
    vec4 posInCamera = clipToEye(v_textureCoordinates, depth1);
    vec4 initialPos = depthToView(v_textureCoordinates, depth1); //just vec3 version of posInCamera ig lol
    vec3 normals = recNormals(vec3(v_textureCoordinates, depth1));
    vec2 pixelSize = czm_pixelRatio / czm_viewport.zw;
    float depthU = czm_readDepth(depthTexture, v_textureCoordinates - vec2(0.0, pixelSize.y));
    float depthD = czm_readDepth(depthTexture, v_textureCoordinates + vec2(0.0, pixelSize.y));
    float depthL = czm_readDepth(depthTexture, v_textureCoordinates - vec2(pixelSize.x, 0.0));
    float depthR = czm_readDepth(depthTexture, v_textureCoordinates + vec2(pixelSize.x, 0.0));
    vec3 normalInCamera = getNormalXEdge(posInCamera.xyz, depthU, depthD, depthL, depthR, pixelSize);
    //normalInCamera = 2.0 * normalInCamera - 1.0;
float maxDistance = 8.0;
float resolution  = 0.1;
int   steps       = 5;
float thickness   = 0.1;

vec4 uv;
vec2 texSize  = czm_viewport.zw;
vec2 texCoord = v_textureCoordinates / texSize;
vec4 positionFrom     = initialPos;
vec3 unitPositionFrom = normalize(positionFrom.xyz);
vec3 normal           = normalize(normals);
vec3 pivot            = normalize(reflect(unitPositionFrom, normal));
vec3 diffVec = clamp((unitPositionFrom.xyz - abs(normal)) * 10.0 * (10.0 * depth1), 0.0, 10.0);
float dotP = clamp(-dot(normal, unitPositionFrom) * 10.0 * (4.0 * depth1), 0.0, 10.0);
float diffTest = clamp(mix((diffVec.y), dotP, 0.1) / 2.25 * depth1, 0.0, 1.0) ;
vec4 startView = vec4(positionFrom.xyz + (pivot * 0.0), 1.0);
vec4 endView   = vec4(positionFrom.xyz + (pivot * maxDistance), 1.0);
float distTo = length(startView - endView);

  vec4 startFrag      = startView;
       // Project to screen space.
       startFrag      = czm_projection * startFrag;
       // Perform the perspective divide.
       startFrag.xyz /= startFrag.w;
       // Convert the screen-space XY coordinates to UV coordinates.
       startFrag.xy   = startFrag.xy * 0.5 + 0.5;
       // Convert the UV coordinates to fragment/pixel coordnates.
       startFrag.xy  *= texSize;

  vec4 endFrag      = endView;
       endFrag      = czm_projection * endFrag;
       endFrag.xyz /= endFrag.w;
       endFrag.xy   = endFrag.xy * 0.5 + 0.5;
       endFrag.xy  *= texSize;

  vec2 frag  = startFrag.xy;
       uv.xy = frag / texSize;

 float deltaX    = endFrag.x - startFrag.x;
  float deltaY    = endFrag.y - startFrag.y;
 float useX      = abs(deltaX) >= abs(deltaY) ? 1.0 : 0.0;
  float delta     = mix(abs(deltaY), abs(deltaX), useX) * clamp(resolution, 0.0, 1.0);

  vec2  increment = vec2(deltaX, deltaY) / max(delta, 0.001);


  float search0 = 0.0;
  float search1 = 0.0;

float currentX = (startFrag.x) * (1.0 - search1) + (endFrag.x) * search1;
float currentY = (startFrag.y) * (1.0 - search1) + (endFrag.y) * search1;

  float hit0 = 0.0;
  float hit1 = 0.0;

  float viewDistance = startView.z;
  float depth        = thickness;

  for (int i = 0; i < 10000; ++i) {
    if (i > int(delta)) {
      break;
    }
    if (depth1 > 0.99) {
      break;
    }
    if (diffTest > 0.4 ) {
      break;

}
    frag      += increment;
    uv.xy      = frag / texSize;
    vec4 positionTo = clipToEye(uv.xy, uv.z);
              search1 =
              mix
              ((frag.y - startFrag.y) / deltaY
              ,(frag.x - startFrag.x) / deltaX
              ,useX
              );
        viewDistance = (startView.y * endView.y) / mix(endView.y, startView.y, search1);
        depth        = viewDistance - positionTo.y;

    if (depth > 0.5 && depth < thickness) {
      hit0 = 1.0;
      break;
    } else {
      search0 = search1;
    }
    search1 = search0 + ((search1 - search0) / 2.0);
    steps *= int(hit0);

    for (int i = 0; i < 10000; ++i) {
    if (i > steps) {
      break;
    }
    frag       = mix(startFrag.xy, endFrag.xy, search1);
    uv.xy      = frag / texSize;
    positionTo = clipToEye(uv.xy, uv.z);
    viewDistance = (startView.y * endView.y) / mix(endView.y, startView.y, search1);
    depth        = viewDistance - positionTo.y;
    if (depth > 0.0 && depth < thickness) {
      hit1 = 1.0;
      search1 = search0 + ((search1 - search0) / 2.0);
    } else {
      float temp = search1;
      search1 = search1 + ((search1 - search0) / 2.0);
      search0 = temp;
    }
    float visibility = hit1 * positionTo.w * ( 1.0 - max(dot(-unitPositionFrom, pivot), 0.0)) * (1.0 - clamp(depth / thickness, 0.0, 1.0)) * (1.0 - clamp(length(positionTo - positionFrom) / maxDistance, 0.0, 1.0)) * (uv.x < 0.0 || uv.x > 1.0 ? 0.0 : 1.0) * (uv.y < 0.0 || uv.y > 1.0 ? 0.0 : 1.0);
      
  visibility = clamp(visibility, 0.0, 1.0);

  uv.ba = vec2(visibility);
         colAtRef = texture2D(colorTexture, uv.xy);
        //gl_FragColor = uv; //display uv debug
          //gl_FragColor = texture2D(colorTexture, uv.xy); //display reflections
         //gl_FragColor = vec4(1.0) *  diffTest;
        //gl_FragColor = vec4(normals, 1.0);
    }
  }
  color = texture2D(colorTexture, v_textureCoordinates);
 if (colAtRef.rgb == vec3(0.0)) {
    gl_FragColor = color;
  } else {
  gl_FragColor = (colAtRef + color) * (0.5 * colAtRef.a); //Ref+Col
  } 
}
`
geofs.ssr = {};
geofs.ssr.isEnabled = false;
geofs.ssr.sNorm = true;
geofs.ssr.update = function() {
  if (geofs.ssr.isEnabled) {
    geofs.ssr.isEnabled = false;
    toggle.setAttribute("class", "mdl-switch mdl-js-switch mdl-js-ripple-effect mdl-js-ripple-effect--ignore-events is-upgraded");
  } else {
    geofs.ssr.isEnabled = true;
    toggle.setAttribute("class", "mdl-switch mdl-js-switch mdl-js-ripple-effect mdl-js-ripple-effect--ignore-events is-upgraded is-checked")
  }
}
geofs.ssr.update1 = function() {
  if (geofs.ssr.sNorm) {
    geofs.ssr.sNorm = false;
    normals.setAttribute("class", "mdl-switch mdl-js-switch mdl-js-ripple-effect mdl-js-ripple-effect--ignore-events is-upgraded");

  } else {
    geofs.ssr.sNorm = true;
    normals.setAttribute("class", "mdl-switch mdl-js-switch mdl-js-ripple-effect mdl-js-ripple-effect--ignore-events is-upgraded is-checked")

  }
}
let elementSel = document.getElementsByClassName('geofs-preference-list')[0].getElementsByClassName('geofs-advanced')[0].getElementsByClassName('geofs-stopMousePropagation')[0];

let toggle = document.createElement("label");
    toggle.setAttribute("class", "mdl-switch mdl-js-switch mdl-js-ripple-effect mdl-js-ripple-effect--ignore-events is-upgraded");
    toggle.setAttribute("for", "ssr");
    toggle.setAttribute("id", "ssr");
    toggle.setAttribute("tabindex", "0");
    toggle.setAttribute("dataUpgraded", ",MaterialSwitch,MaterialRipple");
    toggle.innerHTML = '<input type="checkbox" id="airports" class="mdl-switch__input" data-gespref="geofs.ssr.isEnabled"><span class="mdl-switch__label">Screen Space Reflections</span>';


let normals = document.createElement("label");
    normals.setAttribute("class", "mdl-switch mdl-js-switch mdl-js-ripple-effect mdl-js-ripple-effect--ignore-events is-upgraded");
    normals.setAttribute("for", "normals");
    normals.setAttribute("id", "normals");
    normals.setAttribute("tabindex", "0");
    normals.setAttribute("dataUpgraded", ",MaterialSwitch,MaterialRipple");
    normals.innerHTML = '<input type="checkbox" id="airports" class="mdl-switch__input" data-gespref="geofs.ssr.sNorm"><span class="mdl-switch__label">Smooth Normals</span>';

elementSel.appendChild(toggle);
elementSel.appendChild(normals);
toggle.addEventListener("click", geofs.ssr.update);
normals.addEventListener("click", geofs.ssr.update1);

geofs.fx.rrt = {
  create: function() {
    geofs.fx.rrt.shader =  new Cesium.PostProcessStage({
      fragmentShader : geofs["rrt.glsl"],
      uniforms: {
        reflectionMap: "/shaders/reflection.jpg",
        intensity: 3,
        bias: .1,
        lengthCap: .26,
        stepSize: 1.95,
        frustumLength: 1e3,
        viewType: geofs.camera.currentMode,
        isEnabled: geofs.ssr.isEnabled,
        smoothNormals: geofs.ssr.sNorm
      }
    })
    geofs.api.viewer.scene.postProcessStages.add(geofs.fx.rrt.shader);
  },
  update: function() {
    geofs.fx.rrt.shader.uniforms.viewType = geofs.camera.currentMode;
    geofs.fx.rrt.shader.uniforms.isEnabled = geofs.ssr.isEnabled;
    geofs.fx.rrt.shader.uniforms.smoothNormals = geofs.ssr.sNorm;

  }
};

geofs.fx.rrt.create()

setInterval(function(){geofs.fx.rrt.update();}, 100)
