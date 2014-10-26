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
  var numBonkGroups = 4;
  var numBonksPerGroup = 3;
  var onePixelTexture;
  var snowFlakeTexture;
  var ghostsTexture;
  var rainTexture;
  var balloonTexture;

  var setup = function(services) {
    if (!onePixelTexture) {
      onePixelTexture = new Textures.SolidTexture([255,255,255,255]);
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      c.width = 32;
      c.height = 32;
      for (var ii = 0; ii < 6; ++ii) {
        ctx.save();
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate(ii / 6 * Math.PI * 2);
        ctx.translate(c.width / 4, 0);
        ctx.beginPath();
        ctx.arc(0, 0, c.width / 6, 0, Math.PI * 2, true);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      snowFlakeTexture = new Textures.Texture2D(c);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.beginPath();
      ctx.moveTo(c.width / 2, 4);
      ctx.lineTo(c.width / 2, c.height - 1);
      ctx.strokeStyle = "white";
      ctx.stroke();
      rainTexture = new Textures.Texture2D(c);
      ghostsTexture = services.images.ghosts.frames[0];
      balloonTexture = services.images.balloon.frames[0];
    }
  };

  var createConfetti = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitterInFrontOfPlayer(onePixelTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND);
    emitter.setColorRamp(
        [1, 1, 1, 1]);
    emitter.setParameters({
        numParticles: 200,
        lifeTime: 1.0,
        //timeRange: 0.0,
        startSize: 7.0,
        endSize: 7.0,
        spinSpeedRange: Math.PI * 4},
        function(index, parameters) {
            var speed = Math.random() * 25 + 5;
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

  var createBonk = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitterInFrontOfPlayer(onePixelTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND);
    emitter.setColorRamp(
        [1, 1, 1, 1]);
    emitter.setParameters({
        numParticles: 2 + Misc.randInt(3),
        lifeTime: 0.5,
        //timeRange: 0.0,
        startSize: 3.0,
        endSize: 5.0,
        spinSpeedRange: Math.PI * 4},
        function(index, parameters) {
            var speed = Math.random() * 12 + 5;
            var angle = Math.random() * 2 * Math.PI;
            var color = ImageUtils.hsvToRgb(0.1638, 0.7, 1);
            parameters.startTime = 0;// Math.random() * 0.2;
            parameters.colorMult = [color[0] / 255, color[1] / 255, color[2] / 255, 1];
            parameters.position = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [0, 0, 0])
            parameters.velocity = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 10, 0, 0]);
            parameters.acceleration = Maths.addVector(Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [-speed * 8, 0, 0]), [0, 50, 0]);
        });
    return tdl.particles.createOneShotManager(emitter, numBonksPerGroup);
  };

  var createBallConfetti = function(particleSystemManager, hue) {
    var emitter = particleSystemManager.createParticleEmitterInFrontOfPlayer(onePixelTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND);
    emitter.setColorRamp(
        [1, 1, 1, 1]);
    emitter.setParameters({
        numParticles: 200,
        lifeTime: 1.0,
        //timeRange: 0.0,
        startSize: 7.0,
        endSize: 7.0,
        spinSpeedRange: Math.PI * 4},
        function(index, parameters) {
            var speed = Math.random() * 25 + 5;
            var angle = Math.random() * 2 * Math.PI;
            var color = ImageUtils.hsvToRgb(hue, Math.random() * 0.5 + 0.5, 1);
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

  var createSnow = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitterBehindLevel(snowFlakeTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.ADD);
    emitter.setColorRamp(
        [0.8, 0.9, 1, 0.0,
         0.8, 0.9, 1, 0.2,
         0.8, 0.9, 1, 0.4,
         0.8, 0.9, 1, 0.4,
         0.8, 0.9, 1, 0.2,
         0.8, 0.9, 1, 0.0]);
    emitter.setParameters({
        numParticles: 200,
        lifeTime: 2.0,
        timeRange: 2.0,
        startSize: 17.0,
        endSize: 17.0,
        spinSpeedRange: Math.PI},
        function(index, parameters) {
            var speed = Math.random() * 1 + 3;
            var angle = (Math.random() * 0.2 + 0.4) * Math.PI;
            parameters.position =  [Misc.randInt(1280), Misc.randInt(720) - 32, 0];
            parameters.velocity = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 20, 0, 0]);
        });
    return emitter;
  };

  var createGhosts = function(particleSystemManager, services) {
    var emitter = particleSystemManager.createParticleEmitterInFrontOfPlayer(ghostsTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.SUBTRACT);
    emitter.setColorRamp(
        [0.8, 0.9, 1, 0.0,
         0.8, 0.9, 1, 0.2,
         0.8, 0.9, 1, 0.4,
         0.8, 0.9, 1, 0.6,
         0.8, 0.9, 1, 0.9,
         0.8, 0.9, 1, 0.9,
         0.8, 0.9, 1, 0.3,
         0.8, 0.9, 1, 0.0]);
    var timeRange = 50;
    emitter.setParameters({
        numFrames: 4,
        numParticles: 20,
        frameDuration: timeRange,
        lifeTime: 2.0,
        timeRange: timeRange,
        startSize: 32.0,
        endSize: 256.0,
        spinSpeedRange:  Math.PI * 0},
        function(index, parameters) {
            parameters.startTime  = Math.random() * timeRange;
            parameters.frameStart = Misc.randInt(4);
            var speed = Math.random() * 1 + 3;
            var angle = Math.random() * 0.4 + -0.2;
            parameters.spinStart = angle;
            angle += Math.PI / 2 + (Math.random() > 0.5 ? 0 : Math.PI);
            parameters.position =  [Misc.randInt(1280), Misc.randInt(720) - 32, 0];
            parameters.velocity = Maths.matrix4.transformPoint(
                Maths.matrix4.rotationZ(angle), [speed * 20, 0, 0]);
        });
    return emitter;
  };

  var createRain = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitterBehindLevel(rainTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND);
    var timeRange = 1;
    var angle = Math.PI * 0.6;
    emitter.setParameters({
        numParticles: 100,
        lifeTime: 1.0,
        timeRange: 1.0,
        startSize: 32.0,
        endSize: 32.0,
      },
      function(index, parameters) {
        parameters.spinStart = angle + Math.PI / 16 * 5.0;
        var speed = Math.random() * 10 + 50;
        parameters.position =  [Misc.randInt(1280) + 100, -32, 0];
        parameters.velocity = Maths.matrix4.transformPoint(
            Maths.matrix4.rotationZ(angle), [speed * 20, 0, 0]);
        });
    return emitter;
  };

  var createBalloons = function(particleSystemManager) {
    var emitter = particleSystemManager.createParticleEmitterBehindLevel(balloonTexture.texture);
    emitter.setState(tdl.particles.ParticleStateIds.BLEND_PREMULTIPLY);
    var timeRange = 1;
    emitter.setColorRamp(
        [1, 1, 1, 1]);
    emitter.setParameters({
        numParticles: 20,
        lifeTime: 23.0,
        timeRange: 23.0,
        startSize: 64.0,
        endSize: 64.0,
      },
      function(index, parameters) {
        var angle = Math.PI * (1.4 + Math.random() * 0.2);
        parameters.spinStart = Math.PI * 1.5 - angle;
        var color = ImageUtils.hsvToRgb(Math.random(), Math.random() * 0.5 + 0.5, 1);
        parameters.colorMult = [color[0] / 255, color[1] / 255, color[2] / 255, 1];
        var speed = Math.random() * 1 + 40;
        parameters.position =  [Misc.randInt(1280), 740, 0];
        parameters.velocity = Maths.matrix4.transformPoint(
            Maths.matrix4.rotationZ(angle), [speed, 0, 0]);
        });
    return emitter;
  };

  var ParticleEffectManager = function(services) {
    setup(services);
    this.services = services;
    this.confettis = createConfetti(services.particleSystemManager);
    this.ballRedConfetti = createBallConfetti(services.particleSystemManager, 0);
    this.ballBlueConfetti = createBallConfetti(services.particleSystemManager, 0.666);

    this.nextBonkGroup = 0;
    this.bonkGroups = [];
    for (var ii = 0; ii < numBonkGroups; ++ii) {
      this.bonkGroups.push(createBonk(services.particleSystemManager));
    }
  };

  ParticleEffectManager.prototype.spawnConfetti = function(x, y) {
    var _tp_ = tdl.fast.matrix4.translation(new Float32Array(16), [x, y, 0]);
    this.confettis.startOneShot(_tp_);
  };

  ParticleEffectManager.prototype.spawnBonk = function(x, y) {
    var bonk = this.bonkGroups[this.nextBonkGroup];
    this.nextBonkGroup = (this.nextBonkGroup + 1) % this.bonkGroups.length;
    var _tp_ = tdl.fast.matrix4.translation(new Float32Array(16), [x, y, 0]);
    bonk.startOneShot(_tp_);
  };

  ParticleEffectManager.prototype.spawnBallRedConfetti = function(x, y) {
    var _tp_ = tdl.fast.matrix4.translation(new Float32Array(16), [x, y, 0]);
    this.ballRedConfetti.startOneShot(_tp_);
  };

  ParticleEffectManager.prototype.spawnBallBlueConfetti = function(x, y) {
    var _tp_ = tdl.fast.matrix4.translation(new Float32Array(16), [x, y, 0]);
    this.ballBlueConfetti.startOneShot(_tp_);
  };

  ParticleEffectManager.prototype.createSnow = function() {
    createSnow(this.services.particleSystemManager);
  };

  ParticleEffectManager.prototype.createGhosts = function() {
    createGhosts(this.services.particleSystemManager);
  };

  ParticleEffectManager.prototype.createRain = function() {
    createRain(this.services.particleSystemManager);
  };

  ParticleEffectManager.prototype.createBalloons = function() {
    createBalloons(this.services.particleSystemManager);
  };

  return ParticleEffectManager;
});



