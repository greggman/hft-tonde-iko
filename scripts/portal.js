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
  [ '../bower_components/tdl/tdl/fast',
    '../bower_components/tdl/tdl/math',
    '../bower_components/tdl/tdl/particles',
    '../bower_components/tdl/tdl/textures',
  ], function(
    Fast,
    Maths,
    Particles,
    Textures) {

  var onePixelTexture;

  var setup = function() {
    if (!onePixelTexture) {
      onePixelTexture = new Textures.SolidTexture([255,255,255,255]);
    }
  };

  var createExit = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitter(onePixelTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND);
    emitter.setColorRamp(
        [1, 1, 1, 0,
         1, 1, 1, 1,
         1, 0, 1, 1,
         1, 0, 1, 1,
         1, 0, 1, 0.5,
         1, 1, 1, 0]);
    emitter.setParameters({
        numParticles: 200,
        lifeTime: 0.8,
        timeRange: 0.7,
        startSize: 7.0,
        endSize: 2.0,
        spinSpeedRange: 0},
        function(index, parameters) {
            var speed = Math.random() * 10 + 20;
            var angle = Math.random() * 2 * Math.PI;
            parameters.position = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [-speed, 0, 0])
            parameters.velocity = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 0, 0, 0]);
            parameters.acceleration = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 2, 0, 0]);
        });
    return emitter;
  };

  var createPortal = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitter(onePixelTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND);
    emitter.setColorRamp(
        [1, 1, 1, 0,
         1, 1, 1, 1,
         0, 1, 1, 1,
         0, 0, 1, 1,
         0, 1, 1, 0.5,
         1, 1, 1, 0]);
    emitter.setParameters({
        numParticles: 200,
        lifeTime: 0.8,
        timeRange: 0.7,
        startSize: 7.0,
        endSize: 2.0,
        spinSpeedRange: 0},
        function(index, parameters) {
            var speed = Math.random() * 10 + 20;
            var angle = Math.random() * 2 * Math.PI;
            parameters.position = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [-speed, 0, 0])
            parameters.velocity = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 0, 0, 0]);
            parameters.acceleration = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 2, 0, 0]);
        });
    return emitter;
  };

  var Portal = function(services, data, type) {
    setup();
    this.services = services;
    switch (type) {
      case 1:
        this.emitter = createExit(services.particleSystemManager);
        break;
      default:
        this.emitter = createPortal(services.particleSystemManager);
        break;
    };

    var level = services.levelManager.getLevel();
    var x = (data.tx + 0.5) * level.tileWidth;
    var y = (data.ty + 0.5) * level.tileHeight;
    this.emitter.setTranslation(x, y, 0);
  };

  return Portal;
});


