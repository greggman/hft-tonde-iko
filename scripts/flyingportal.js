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
    './math',
   './particleemitter',
  ], function(
    Misc,
    Strings,
    M2D,
    ImageUtils,
    gmath,
    ParticleEmitter) {

  var nextColor = 0;
  var balls = [];
  var nameFontOptions = {
    font: "16px sans-serif",
    yOffset: 18,
    height: 20,
    fillStyle: "black",
  };

  /**
   * FlyingPortal represnt a portal that bounces around the level like the fireball in Super Mario Bros arcade game.
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
      this.stopFriction = globals.stopFriction;
      this.ballElasticity = globals.ballElasticity;
      this.ballStopVelocity = globals.ballStopVelocity;
      this.walkAcceleration = globals.moveAcceleration;
      this.idleAnimSpeed = (0.8 + Math.random() * 0.4) * globals.idleAnimSpeed;
      this.points = 0;
      
      var h = (++nextColor) % 2 ? 0 : 0.4;
      this.colorIndex = nextColor;
      this.color = {
        id: 0,
        h: h,
        s: 0,
        v: 0,
        hsv: [h, 0, 0, 0],
        range: [180 / 360, 275 / 360],
      };
      this.width  = 24;
      this.height = 24;
      var startPosition = {
        x: (data.tx + 0.5) * level.tileWidth,
        y: (data.ty + 0.5) * level.tileHeight
      };
      this.id = data.tileInfo.id;

      this.data = data;
      
      
      this.animTimer = 0;
      this.canJump = false;
      this.checkWallOffset = [
        -this.width / 2,
        this.width / 2 - 1,
      ];
      this.timeAccumulator = 0;
      this.moveVector = {};
      this.workVector = {};
      this.tileVector = {};

      this.sprite = this.services.spriteManager.createSprite();
      this.nameSprite = this.services.spriteManager.createSprite();


      this.pm = new ParticleEmitter(services, data, {type: "teleport",     particleType: 0, constructor: ParticleEmitter,  } );
      this.emitter = this.pm.emitters[0];

      this.setName();
      this.direction = data.direction || 0;         // direction player is pushing (-1, 0, 1)
      this.facing = 1; //data.facing || direction;    // direction player is facing (-1, 1)
      this.score = 0;
      this.addPoints(0);

      //console.log(startPosition);
      this.reset(startPosition);
      this.setState('move');


      this.checkBounds();
      balls.push(this);
    };
  }());

  FlyingPortal.prototype.setName = function() {
   	var name = this.points.toString();
    if (name != this.playerName) {
      this.playerName = name;
      this.nameImage = this.services.createTexture(
          ImageUtils.makeTextImage(name, nameFontOptions));
    }
  };

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

  FlyingPortal.prototype.updateMoveVector = function() {
    this.moveVector.x = this.position[0] - this.lastPosition[0];
    this.moveVector.y = this.position[1] - this.lastPosition[1];
  };

  FlyingPortal.prototype.addPoints = function(points) {
    this.score += points;
  };

  FlyingPortal.prototype.setState = function(state) {
    if (state != 'move') {
      return;
    }
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
    this.services.spriteManager.deleteSprite(this.sprite);
    this.services.spriteManager.deleteSprite(this.nameSprite);
    this.services.entitySystem.removeEntity(this);
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

  FlyingPortal.prototype.updateVelocity = function(axis, elapsedTime) {
    var globals = this.services.globals;
    var axis = axis || 3;
    if (axis & 1) {
//      this.velocity[0] += this.acceleration[0] * elapsedTime;
      this.velocity[0] = Misc.clampPlusMinus(this.velocity[0], globals.maxVelocityBall[0]);
    }
    if (axis & 2) {
      this.velocity[1] += (this.acceleration[1] + globals.ballGravity) * elapsedTime;
      this.velocity[1] = Misc.clampPlusMinus(this.velocity[1], globals.maxVelocityBall[1]);
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
 //     this.updateVelocity(axis, kOneTick);
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
        var tile = levelManager.getTileInfoByPixel(xCheck, this.position[1] + this.height / 4 - this.height / 2 * ii);
        if ((tile.solidForAI && !tile.oneWay) || ( tile.collisions && (!tile.sideBits || (tile.sideBits & 0x3)))) {
          if (!didBounce) {
            this.velocity[0] = -this.velocity[0]; // * this.ballElasticity; //0; jma
            didBounce = true;
          }
          var distInTile = gmath.emod(xCheck, level.tileWidth);
          var xoff = off ? -distInTile : level.tileWidth - distInTile;
          this.position[0] += xoff;
        }
        if (tile.teleport && tile.local) {
          this.doTeleport(level, tile, 1);
        }
    }
  };

  FlyingPortal.prototype.doTeleport = function(level, tile, numPoints){
   this.services.collectableManager.spawn(this.position, this.velocity, 3);
    var dest = level.getLocalDest(tile.dest);
    if (!dest) {
      console.error("missing local dest for dest: " + tile.dest);
      return;
    }
    this.points += numPoints;
    if (this.points >= this.services.globals.ballWinGamePoints)
    {
      // Do confetti of this ballsc color here:
      if ((this.colorIndex % 2)== 0) {
        this.services.particleEffectManager.spawnBallRedConfetti(this.position[0], this.position[1]);
      } else {
        this.services.particleEffectManager.spawnBallBlueConfetti(this.position[0], this.position[1]);
      }

      // Reset all ball points to 0. (new game)
        this.points = 0;
        for (var i=0; i < balls.length; ++i)
        {
          if (balls[i] != this)
          {
            balls[i].points = 0;
            balls[i].setName();
          }
        }  
    }

    dest = dest[Misc.randInt(dest.length)];
    this.position[0] = (dest.tx + 0.5) * level.tileWidth;
    this.position[1] = (dest.ty +   1) * level.tileHeight - 1;
    this.setName();
  };

  FlyingPortal.prototype.teleportPlayer = function(player) {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    var dest = level.getLocalDest(this.data.tileInfo.dest); //tile.dest);
    if (!dest) {
      console.error("missing local dest for dest: " );
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
        var radius = 16;
        var radius2 = radius * radius;
        if (dx2 > radius2) {
          return false;
        }
        var dy = this.position[1] - (player.position[1] - player.height/2);
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
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1] - this.height/2);
      if ((tile.solidForAI && !tile.oneWay) || (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x4)))) {
        this.velocity[1] = -this.velocity[1]; // * this.ballElasticity; // 0;
        this.position[1] = (gmath.unitdiv(this.position[1], level.tileHeight) ) * level.tileHeight + this.height/2;
   //     this.velocity[0] *= this.stopFriction;
        if (!this.bonked) {
          this.bonked = true;
          //this.services.audioManager.playSound('bonkhead');
        }
        return true;
      }
      if (tile.teleport && tile.local) {
        this.doTeleport(level, tile, 1);
      }
    }
    return false;
  };

  FlyingPortal.prototype.checkDown = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1] + this.height/2);
      if (tile.solidForAI) {
        var ty = gmath.unitdiv(this.position[1], level.tileHeight) * level.tileHeight;
        if (!this.oneWay || this.lastPosition[1] <= ty) {
          this.position[1] = Math.floor(this.position[1] / level.tileHeight) * level.tileHeight + this.height/2;
          this.velocity[1] = -Math.abs(this.velocity[1]); // * this.ballElasticity; //0;
          this.stopFriction = tile.stopFriction || globals.stopFriction;
        //  this.velocity[0] *= this.stopFriction;
          if (!this.landed) {
            this.landed = true;
            //this.services.audioManager.playSound('land');
          }
        }
        return true;
      }
      if (tile.teleport && tile.local) {
        this.doTeleport(level, tile, 1);
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
//    this.checkBall();
    this.checkTeleport();
    this.updatePhysics();

    this.checkLand()
    this.checkWall();

    this.lastDirection = this.direction;
  };

  return FlyingPortal;
});

