/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

define(
  [ 'hft/misc/misc',
    '../bower_components/hft-utils/dist/imageutils',
    '../bower_components/tdl/tdl/fast',
    '../bower_components/tdl/tdl/math',
    '../bower_components/tdl/tdl/particles',
    '../bower_components/tdl/tdl/textures',
  ], function(
    Misc,
    ImageUtils,
    Fast,
    Maths,
    Particles,
    Textures) {

  var maxConfetti = 10;
  var onePixelTexture;

  var setup = function() {
    if (!onePixelTexture) {
      onePixelTexture = new Textures.SolidTexture([255,255,255,255]);
    }
  };

  var createConfetti = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitter(onePixelTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND);
    emitter.setColorRamp(
        [1, 1, 1, 1]);
    emitter.setParameters({
        numParticles: 200,
        lifeTime: 1.0,
        timeRange: 0.0,
        startSize: 7.0,
        endSize: 7.0,
        spinSpeedRange: Math.PI * 2},
        function(index, parameters) {
            var speed = Math.random() * 10 + 20;
            var angle = Math.random() * 2 * Math.PI;
            var color = ImageUtils.hsvToRgb(Math.random(), 0.7, 1);
            parameters.startTime = Math.random() * 0.2;
            parameters.colorMult = [color[0] / 255, color[1] / 255, color[2] / 255, 1];
            parameters.position = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [0, 0, 0])
            parameters.velocity = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 20, 0, 0]);
            parameters.acceleration = Maths.addVector(Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [-speed * 8, 0, 0]), [0, 100, 0]);
        });
    return tdl.particles.createOneShotManager(emitter, maxConfetti);
  };

  var ParticleEffectManager = function(services) {
    setup();
    this.services = services;
    this.confettis = createConfetti(services.particleSystemManager);
  };

  ParticleEffectManager.prototype.spawnConfetti = function(x, y) {
    var _tp_ = tdl.fast.matrix4.translation(new Float32Array(16), [x, y, 0]);
    this.confettis.startOneShot(_tp_);
  };

  return ParticleEffectManager;
});



