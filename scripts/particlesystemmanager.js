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
  ], function(
    Fast,
    Maths,
    Particles) {

  var numParticleSystems = 3;

  var ParticleSystemManager = function(services) {
    var projection  = Fast.matrix4.identity(new Float32Array(16));
    var world       = Fast.matrix4.identity(new Float32Array(16));
    var viewInverse = Fast.matrix4.identity(new Float32Array(16));

    var particleSystems = [];
    for (var ii = 0; ii < numParticleSystems; ++ii) {
      particleSystems.push(new Particles.ParticleSystem(
          gl, null, Maths.pseudoRandom));
    }

    var draw = function(systemNdx, offset) {
      var particleSystem = particleSystems[systemNdx];
      world[12] = offset.x;
      world[13] = offset.y;
      var width = gl.canvas.width;
      var height = gl.canvas.height;
      projection[0] =  2 / width;
      projection[5] = -2 / height
      projection[12] = -1 + 1 / width;
      projection[13] =  1 - 1 / height;

      particleSystem.draw(projection, world, viewInverse);
    };

    this.createParticleEmitterInFrontOfPlayer = function() {
      var particleSystem = particleSystems[2];
      return particleSystem.createParticleEmitter.apply(particleSystem, arguments);
    };

    this.createParticleEmitterBehindPlayer = function() {
      var particleSystem = particleSystems[1];
      return particleSystem.createParticleEmitter.apply(particleSystem, arguments);
    };

    this.createParticleEmitterBehindLevel = function() {
      var particleSystem = particleSystems[0];
      return particleSystem.createParticleEmitter.apply(particleSystem, arguments);
    };

    this.drawParticleSystemInFrontOfPlayer = function(offset) {
      draw(2, offset);
    };

    this.drawParticleSystemBehindPlayer = function(offset) {
      draw(1, offset);
    };

    this.drawParticleSystemBehindLevel = function(offset) {
      draw(0, offset);
    };
  };

  return ParticleSystemManager;
});



