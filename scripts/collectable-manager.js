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

define([
    './collectable',
  ], function(
    Collectable
  ) {

  var maxCollectables = 50;

  var CollectableManager = function(services) {
    this.collectables = [];
    this.targetCount = 1;
    this.services = services;

    services.entitySystem.addEntity(this);

    for (var ii = 0; ii < maxCollectables; ++ii) {
      new Collectable(services, this);
    };

    this.resetBonusTime();
  };

  var randInt = function(min, max) {
    return Math.floor(min + Math.random() * (max - min));
  };

  CollectableManager.prototype.resetBonusTime = function() {
    var globals = this.services.globals;
    this.bonusTime = randInt(globals.minBonusTime, globals.maxBonusTime);
  };

  CollectableManager.prototype.addInActive = function(collectable) {
    this.collectables.push(collectable);
  };

  CollectableManager.prototype.process = function() {
    var globals = this.services.globals;
    if (globals.levelName == "level1-0") {
    	return; // no coin rain on ball level
    }
    this.bonusTime -= globals.elapsedTime;
    if (this.bonusTime <= 0) {
      if (this.services.playerManager.getNumPlayers() == 0) {
        this.bonusTime = 30 + Math.random() * 15;
      } else {
        this.targetCount = maxCollectables;
        var endTime = this.targetCount * globals.bonusSpeed * 1/60;
        if (this.collectables.length == 0 || -this.bonusTime > endTime) {
          this.targetCount = 1;
          this.resetBonusTime();
        }
      }
    }


    if (globals.frameCount % globals.bonusSpeed == 0) {
      var numActive = maxCollectables - this.collectables.length;
      if (numActive < this.targetCount) {
        var collectable = this.collectables.pop();
        collectable.chooseNewPosition();
      }
    }
  };

  CollectableManager.prototype.spawn = function(pos, vel, num) {
    var globals = this.services.globals;
    //console.log("Spawning a coin.")
    var posSpread = [pos[0], pos[1]];
    var velSpread = [vel[0], vel[1]];
    while (num && this.collectables.length > 0) {
      var collectable = this.collectables.pop();
      //console.log(pos);
      //console.log(vel);
      collectable.spawnAtPosition(posSpread, velSpread);
      --num;
      posSpread[0] += vel[0] * 0.1666; // * 1/60 second * 10
      velSpread[1] *= 1.2;
      //console.log(collectable)
   }
  }
  return CollectableManager;
});


