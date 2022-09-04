# Screen-Space Reflection Shader 1.1b

Just copy into the console and enable it in the preferences panel.


**Settings:**<br>
There are three new settings in the graphics panel, one to toggle the shader, one to toggle the smooth normal calculations, and one to change the strength of the reflections.<br>
The shader is off by default, you will need to turn it on in the panel.<br>
Smooth normals are a little complicated, here is the gist of it:<br>
Smooth normals make the reflections more consistent with the surface of the aircraft, however, they can cause artifacts<br>
at intersections with other surfaces, for example, the ground. They also degrade accuracy at far viewing points.<br>

*Smooth Normals Off:*<br>
<img width="918" alt="Screen Shot 2022-07-01 at 2 55 39 PM" src="https://user-images.githubusercontent.com/79466778/176960809-e052aac7-3d47-4170-913d-8cf21363c006.png">


*Smooth Normals On:*<br>
<img width="828" alt="Screen Shot 2022-07-01 at 2 53 45 PM" src="https://user-images.githubusercontent.com/79466778/176960894-f7730080-1231-4b2e-9039-84b1e9c98afb.png">





# Gallery:
<img width="934" alt="Screen Shot 2022-06-30 at 3 40 05 PM" src="https://user-images.githubusercontent.com/79466778/176767590-9d78a758-d44d-4fd6-b4a6-e5ff9d87079a.png">
<img width="1111" alt="Screen Shot 2022-06-30 at 3 39 14 PM" src="https://user-images.githubusercontent.com/79466778/176767595-83ce20da-12a1-4c13-ae2e-06b8d2403f37.png">
<img width="862" alt="Screen Shot 2022-06-30 at 3 38 05 PM" src="https://user-images.githubusercontent.com/79466778/176767598-fdd7dad5-36e2-4be3-9c40-8ee786020ff3.png">
<img width="1277" alt="Screen Shot 2022-06-30 at 3 37 38 PM" src="https://user-images.githubusercontent.com/79466778/176767601-8150f0ed-58fd-4957-ac64-e0b6a400bf17.png">
<img width="555" alt="Screen Shot 2022-06-30 at 3 36 51 PM" src="https://user-images.githubusercontent.com/79466778/176767602-3bdaaf85-d59f-43e5-a135-5e46984a3f2a.png">
<img width="1079" alt="Screen Shot 2022-06-30 at 3 36 29 PM" src="https://user-images.githubusercontent.com/79466778/176767603-1e88367e-06c6-40ad-8ddf-2afe7ad2d43b.png">
<img width="908" alt="Screen Shot 2022-06-30 at 3 27 41 PM" src="https://user-images.githubusercontent.com/79466778/176767604-2fd0cb4c-5ec3-437d-8fa5-756b7f2c4929.png">



# Changelog:

v.1.0: Initial Release.<br>

v.1.1a: Fixed depth calculations, no more shiny terrain at distances. Fixed sky flashes. Reflections no longer appear in cockpit.<br>
Added normal smoothing calculations. Added close-up reflections. Adjusted view angle cutoff.<br>

v.1.1b: Fixed smooth normals edge artifacts.<br>

v.1.3: Full 3.3 Compatability.<br>

**v.1.4:** Per-Object shading is now in place to fix the issues with shiny ground. Smooth Normals have been partially rewritten to provide better results with less artifacts. A new option has been added to the menu to provide control over the strength of the effect. The code is now minified.

