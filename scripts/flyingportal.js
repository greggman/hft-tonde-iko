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
    'hft/misc/misc',
    'hft/misc/strings',
    '../bower_components/hft-utils/dist/2d',
    '../bower_components/hft-utils/dist/imageutils',
    './particleemitter',
    './math',
  ], function(
    Misc,
    Strings,
    M2D,
    ImageUtils,
    ParticleEmitter,
    gmath) {

  /**
   * FlyingPortal represnt a portal that bounces around the level like the fireball in Super Mario Bros.
   * @constructor
   */
  var FlyingPortal = (function() {
    //return function(services, width, height, direction, name, netPlayer, startPosition, data, player) {
    return function(services, data) {
      data = data || {tx:4, ty:4};
      var globals = services.globals;
      this.services = services;
      var levelManager = this.services.levelManager;
      var level = levelManager.getLevel();
      
      this.renderer = services.renderer;
      services.entitySystem.addEntity(this);
      this.velocity = [50, -150];
      this.acceleration = [0, 0];
      
      this.width  = 32;
      this.height = 32;
      var startPosition = {
        x: (data.tx + 0.5) * level.tileWidth,
        y: (data.ty + 0.5) * level.tileHeight
      };
      this.id = data.tileInfo.id;

      this.data = data;
      
      this.checkWallOffset = [
        -this.width / 2,
        this.width / 2 - 1,
      ];

      this.pm = new ParticleEmitter(services, {tileInfo: {teleportDest: 0}}, {type: "teleport",     particleType: 0, constructor: ParticleEmitter,  } );
      this.emitter = pm.emitters[0];
      
      this.direction = data.direction || 0;         // direction player is pushing (-1, 0, 1)

      //console.log(startPosition);
      this.reset(startPosition);
      this.setState('move');


      this.checkBounds();
    };
  }());


  FlyingPortal.prototype.reset = function(startPosition) {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    //console.log (levelManager.getRandomOpenPosition());
    var position = startPosition || levelManager.getRandomOpenPosition();
    this.position = [position.x, position.y];
    this.lastPosition = [this.position[0], this.position[1]];
    this.sprite.uniforms.u_hsvaAdjust = this.color.hsv.slice();
    this.sprite.uniforms.u_adjustRange = this.color.range.slice();
  };

  FlyingPortal.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  FlyingPortal.prototype.checkBounds = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    if (this.position[1] >= level.levelHeight) {
      debugger;
    }
  };

  FlyingPortal.prototype.removeFromGame = function() {
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
  };

  FlyingPortal.prototype.updatePosition = function(axis, elapsedTime) {
    var axis = axis || 3;
    if (axis & 1) {
      this.position[0] += this.velocity[0] * elapsedTime;
    }
    if (axis & 3) {
      this.position[1] += this.velocity[1] * elapsedTime;
    }
  };

  FlyingPortal.prototype.updatePhysics = function(axis) {
    var kOneTick = 1 / 60;
    var globals = this.services.globals;
    this.timeAccumulator += globals.elapsedTime;
    var ticks = (this.timeAccumulator / kOneTick) | 0;
    this.timeAccumulator -= ticks * kOneTick;
    this.lastPosition[0] = this.position[0];
    this.lastPosition[1] = this.position[1];
    for (var ii = 0; ii < ticks; ++ii) {
//      this.updateVelocity(axis, kOneTick);
      this.updatePosition(axis, kOneTick);
    }
    this.emitter.setTranslation(this.position[0], this.position[1], 0);
  };

  FlyingPortal.prototype.checkWall = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var off = this.velocity[0] < 0 ? 0 : 1;
    var didBounce = false;
    for (var ii = 0; ii < 2; ++ii) {
      var xCheck = this.position[0] + this.checkWallOffset[off];
        var tile = levelManager.getTileInfoByPixel(xCheck, this.position[1] - this.height / 4 - this.height / 2 * ii);
        if ((tile.solidForAI && !tile.oneWay) || ( tile.collisions && (!tile.sideBits || (tile.sideBits & 0x3)))) {
          if (!didBounce) {
            this.velocity[0] = -this.velocity[0]; //0; jma
             didBounce = true;
          }
          var distInTile = gmath.emod(xCheck, level.tileWidth);
          var xoff = off ? -distInTile : level.tileWidth - distInTile;
          this.position[0] += xoff;
        }
    }
  };


    dest = dest[Misc.randInt(dest.length)];
    this.position[0] = (dest.tx + 0.5) * level.tileWidth;
    this.position[1] = (dest.ty +   1) * level.tileHeight - 1;
  };


  FlyingPortal.prototype.teleportPlayer = function(player) {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    var dest = level.getLocalDest(0); //tile.dest);
    if (!dest) {
      console.error("missing local dest for dest: " + tile.dest);
      return;
    }
    dest = dest[Misc.randInt(dest.length)];
    player.posDestTeleport[0] =  (dest.tx + 0.5) * level.tileWidth;
    player.posDestTeleport[1] =  (dest.ty +   1) * level.tileHeight - 1;
    player.statePrevTeleport = player.state;
    player.setState("teleport");
  }
  
  FlyingPortal.prototype.checkTeleport = function(){
    if (!this.checkTeleportPlayer) {
      this.checkTeleportPlayer = function(player) {
        var dx = this.position[0] - (player.position[0]);
        var dx2 = dx * dx;
        var radius = 28;
        var radius2 = radius * radius;
        if (dx2 > radius2) {
          return false;
        }
        var dy = this.position[1] - (player.position[1] + 12);
        var dy2 = dy*dy;
        if (dy2 > radius2) {
          return false;
        }
        if (player.state != "teleport")
        	this.teleportPlayer(player);
        	
        return false;
      }.bind(this);
    }
    this.services.playerManager.forEachPlayer(this.checkTeleportPlayer);
  }
  
  FlyingPortal.prototype.checkUp = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1] - this.height);
      if ((tile.solidForAI && !tile.oneWay) || (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x4)))) {
        this.velocity[1] = -this.velocity[1] * this.ballElasticity; // 0;
        if (Math.abs(this.velocity[1]) < this.ballStopVelocity) {
          this.velocity[1] = 0;
        }
        this.position[1] = (gmath.unitdiv(this.position[1], level.tileHeight) + 1) * level.tileHeight;
        this.velocity[0] *= this.stopFriction;
        if (!this.bonked) {
          this.bonked = true;
          //this.services.audioManager.playSound('bonkhead');
        }
        return true;
      }
    }
    return false;
  };

  FlyingPortal.prototype.checkDown = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1]);
      if (tile.solidForAI) {
        var ty = gmath.unitdiv(this.position[1], level.tileHeight) * level.tileHeight;
        if (!this.oneWay || this.lastPosition[1] <= ty) {
          this.position[1] = Math.floor(this.position[1] / level.tileHeight) * level.tileHeight;
          this.velocity[1] = -Math.abs(this.velocity[1]) * this.ballElasticity; //0;
          if (Math.abs(this.velocity[1]) < this.ballStopVelocity) {
            this.velocity[1] = 0;
          }
          this.stopFriction = tile.stopFriction || globals.stopFriction;
          this.velocity[0] *= this.stopFriction;
          if (!this.landed) {
            this.landed = true;
            //this.services.audioManager.playSound('land');
          }
        }
        return true;
      }
    }
    return false;
  };

  FlyingPortal.prototype.checkLand = function() {
    if (this.velocity[1] > 0) {
      this.bonked = false;
      return this.checkDown();
    } else if (this.velocity[1] < 0){
      this.landed = false;
      return this.checkUp();
    }
  };

  FlyingPortal.prototype.init_move = function() {
    this.animTimer = 0;
    this.anim = this.services.images.ball.frames;
    this.lastDirection = this.direction;
    this.bonked = false;
    this.landed = false;

  };

  FlyingPortal.prototype.state_move = function() {

    var globals = this.services.globals;
//jma    this.acceleration[0] = this.lastDirection * this.walkAcceleration;
    this.animTimer += globals.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    //this.updatePhysics(1);
    this.checkTeleport();
    this.updatePhysics();

    this.checkLand()
    this.checkWall();

    this.lastDirection = this.direction;
  };


  return FlyingPortal;
});

