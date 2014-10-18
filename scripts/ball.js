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
  ], function(
    Misc,
    Strings,
    M2D,
    ImageUtils,
    gmath) {

  var availableColors = [];
  var nextColor = 0;
  var nameFontOptions = {
    font: "16px sans-serif",
    yOffset: 18,
    height: 20,
    fillStyle: "black",
  };

  /**
   * Ball represnt a ball in the game.
   * @constructor
   */
  var Ball = (function() {
    //return function(services, width, height, direction, name, netPlayer, startPosition, data, player) {
    return function(services, data) {
      data = data || {tx:4, ty:4};
      var globals = services.globals;
      this.services = services;
      var levelManager = this.services.levelManager;
      var level = levelManager.getLevel();
      
      this.renderer = services.renderer;
      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);
      this.velocity = [50, -150];
      this.acceleration = [0, 0];
      this.stopFriction = globals.stopFriction;
      this.ballElasticity = globals.ballElasticity;
      this.ballStopVelocity = globals.ballStopVelocity;
      this.walkAcceleration = globals.moveAcceleration;
      this.idleAnimSpeed = (0.8 + Math.random() * 0.4) * globals.idleAnimSpeed;
      this.points = 0;
      
//      if (data.color) {
//        this.color = data.color;
//      } else 
      {
        if (availableColors.length == 0) {
            var h = -.5;
            var s = 0;
            var v = 0;
            availableColors.push({
              id: 0,
              h: h,
              s: s,
              v: v,
              hsv: [h, s, v, 0],
              range: [180 / 360, 275 / 360],
            });
            h = 0;
            availableColors.push({
              id: 0,
              h: h,
              s: s,
              v: v,
              hsv: [h, s, v, 0],
              range: [180 / 360, 275 / 360],
            });            
//          for (var ii = 0; ii < 32; ++ii) {
//            var h = ii / 32;
//            var s = (ii % 2) * -0.6;
//            var v = (ii % 2) * 0.1;
//            availableColors.push({
//              id: 0,
//              h: h,
//              s: s,
//              v: v,
//              hsv: [h, s, v, 0],
//              range: [180 / 360, 275 / 360],
//            });
//          }
        }
        var colorNdx = nextColor++; //Math.floor(Math.random() * availableColors.length);
        if (colorNdx >= availableColors.length)
        	colorNdx = 0;
        this.color = availableColors[colorNdx];
        //availableColors.splice(colorNdx, 1);
      }
	    this.width = 32; level.tileWidth;
	    this.height = 32; level.tileHeight;
	    var startPosition = {
	      x: (data.tx + 0.5) * 32, //level.tileWidth,
	      y: (data.ty + 0.5) * 32, //level.tileHeight
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


      this.setName(name);
      this.direction = data.direction || 0;         // direction player is pushing (-1, 0, 1)
      this.facing = 1; //data.facing || direction;    // direction player is facing (-1, 1)
      this.score = 0;
      this.addPoints(0);

      //console.log(startPosition);
      this.reset(startPosition);
      this.setState('move');


      this.checkBounds();
    };
  }());

  Ball.prototype.setName = function(name) {
   	name = this.points.toString();
    if (name != this.playerName) {
      this.playerName = name;
      this.nameImage = this.services.createTexture(
          ImageUtils.makeTextImage(name, nameFontOptions));
    }
  };

  Ball.prototype.reset = function(startPosition) {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    console.log (levelManager.getRandomOpenPosition());
    var position = startPosition || levelManager.getRandomOpenPosition();
    this.position = [position.x, position.y];
    this.lastPosition = [this.position[0], this.position[1]];
    this.sprite.uniforms.u_hsvaAdjust = this.color.hsv.slice();
    this.sprite.uniforms.u_adjustRange = this.color.range.slice();
  };

  Ball.prototype.updateMoveVector = function() {
    this.moveVector.x = this.position[0] - this.lastPosition[0];
    this.moveVector.y = this.position[1] - this.lastPosition[1];
  };

  Ball.prototype.checkCollisions = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    var xp = this.lastPosition[0];
    var yp = this.lastPosition[1];

    var tile = 0;
  };

  Ball.prototype.addPoints = function(points) {
    this.score += points;
  };

  Ball.prototype.setState = function(state) {
  if (state != 'move')
  	return;
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  Ball.prototype.checkBounds = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    if (this.position[1] >= level.levelHeight) {
      debugger;
    }
  };

  Ball.prototype.removeFromGame = function() {
return ; ////////////////////////////////////////////////////////////////////////////////////////////// fix this todo jma  
    this.services.spriteManager.deleteSprite(this.sprite);
    this.services.spriteManager.deleteSprite(this.nameSprite);
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
  };

  Ball.prototype.updatePosition = function(axis, elapsedTime) {
    var axis = axis || 3;
    this.lastPosition[0] = this.position[0];
    this.lastPosition[1] = this.position[1];
    if (axis & 1) {
      this.position[0] += this.velocity[0] * elapsedTime;
    }
    if (axis & 3) {
      this.position[1] += this.velocity[1] * elapsedTime;
    }
  };

  Ball.prototype.updateVelocity = function(axis, elapsedTime) {
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

  Ball.prototype.updatePhysics = function(axis) {
    var kOneTick = 1 / 60;
    var globals = this.services.globals;
    this.timeAccumulator += globals.elapsedTime;
    var ticks = (this.timeAccumulator / kOneTick) | 0;
    this.timeAccumulator -= ticks * kOneTick;
    for (var ii = 0; ii < ticks; ++ii) {
      this.updateVelocity(axis, kOneTick);
      this.updatePosition(axis, kOneTick);
    }
  };

  Ball.prototype.teleportToOtherGame = function(dir, dest, subDest) {
return ; ////////////////////////////////////////////////////////////////////////////////////////////// fix this todo jma  
  
    // HACK!
    var globals = this.services.globals;
    var parts = /s(\d+)-(\d+)/.exec(globals.id);
    var id = parseInt(parts[1]) + parseInt(parts[2]) * globals.columns;
    var numScreens = globals.columns * globals.rows;
    id = gmath.emod(id + dir, numScreens);
    var id = "s" + (id % globals.columns) + "-" + (Math.floor(id / globals.columns));
    this.netPlayer.switchGame(id, {
      name: this.playerName,    // Send the name because otherwise we'll make a new one up
      dest: dest,               // Send the dest so we know where to start
      subDest: subDest,         // Send the subDest so we know which subDest to start
      color: this.color,        // Send the color so we don't pick a new one
      direction: this.direction,// Send the direction so if we're moving we're still moving.
      facing: this.facing,      // Send the facing so we're facing the sme way
      velocity: this.velocity,  // Send the velocity so where going the right speed
      score: this.score,        // Send the score
      position: this.position,  // Send the position incase there's no dest.
    });
  };

  Ball.prototype.checkWall = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var off = this.velocity[0] < 0 ? 0 : 1;
    var didBounce = false;
    for (var ii = 0; ii < 2; ++ii) {
      var xCheck = this.position[0] + this.checkWallOffset[off];
      if (xCheck < 0) {
        if (xCheck < -level.tileWidth / 2) {
          this.teleportToOtherGame(-1);
        }
      } else if (xCheck >= level.levelWidth) {
        if (xCheck >= level.levelWidth + level.tileWidth / 2) {
          this.teleportToOtherGame(1);
        }
      } else {
        var tile = levelManager.getTileInfoByPixel(xCheck, this.position[1] - this.height / 4 - this.height / 2 * ii);
        if (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x3))) {
          if (!didBounce) {
	          this.velocity[0] = -this.velocity[0] * this.ballElasticity; //0; jma
	          if (Math.abs(this.velocity[0]) < this.ballStopVelocity) {
	          	this.velocity[0] = 0;
	          }
          	didBounce = true;
          }
          var distInTile = xCheck % level.tileWidth;
          var xoff = off ? -distInTile : level.tileWidth - distInTile;
          this.position[0] += xoff;
        }
        if (tile.teleport) {
          if (tile.local) {
            var dest = level.getLocalDest(tile.dest);
            if (!dest) {
              console.error("missing local dest for dest: " + tile.dest);
              return;
            }

            dest = dest[Misc.randInt(dest.length)];
            this.position[0] = (dest.tx + 0.5) * level.tileWidth;
            this.position[1] = (dest.ty +   1) * level.tileHeight - 1;
            this.points += 1;
            this.setName(this.playerName);
          } else {
            var dir = (tile.dest == 0 || tile.dest == 2) ? -1 : 1;
            this.teleportToOtherGame(dir, tile.dest, tile.subDest);
          }
        }
      }
    }
  };

  Ball.prototype.checkBall = function(){
	if (!this.checkBallPlayer) {
	  this.checkBallPlayer = function(player) {
  			var dx = this.position[0] - (player.position[0]);
  			var dx2 = dx * dx;
  			var radius = 28;
  			var radius2 = radius * radius;
  			if (dx2 > radius2) return;
  			var dy = this.position[1] - (player.position[1] + 12);
  			var dy2 = dy*dy;
  			if (dy2 > radius2) return;
  			this.velocity[0] += dx;
  			this.velocity[1] += dy;
  			var len = Math.sqrt(dx2 + dy2);
  			if (len > 0.1)
  			{
  				dx /= len;
  				dy /= len;
  				var dot = dx*player.velocity[0] + dy * player.velocity[1];
  				this.velocity[0] += dx * dot * 0.5;
  				this.velocity[1] += dy * dot * 0.5;
  			}
  			return false;	  
	  }.bind(this);
       
	}
	this.services.playerManager.forEachPlayer(this.checkBallPlayer);
  }
  
  Ball.prototype.checkUp = function() {
    var levelManager = this.services.levelManager;
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1] - this.height);
      if (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x4))) {
        var level = levelManager.getLevel();
        this.velocity[1] = -this.velocity[1] * this.ballElasticity; // 0;
	    if (Math.abs(this.velocity[1]) < this.ballStopVelocity) {
	      this.velocity[1] = 0;
	    }
        this.position[1] = (Math.floor(this.position[1] / level.tileHeight) + 1) * level.tileHeight;
        this.velocity[0] *= this.stopFriction;
       if (!this.bonked) {
          this.bonked = true;
          this.services.audioManager.playSound('bonkhead');
        }
        return true;
      }
    }
    return false;
  };

  Ball.prototype.checkDown = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1]);
      if (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x8))) {
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
          	this.services.audioManager.playSound('land');
          }
        }
        return true;
      }
    }
    return false;
  };

  Ball.prototype.checkLand = function() {
    if (this.velocity[1] > 0) {
    	this.bonked = false;
      return this.checkDown();
    } else if (this.velocity[1] < 0){
    	this.landed = false;
      return this.checkUp();
    }
  };

  Ball.prototype.init_move = function() {
    this.animTimer = 0;
    this.anim = this.services.images.ball.frames;
    this.lastDirection = this.direction;
    this.bonked = false;
    this.landed = false;

  };

  Ball.prototype.state_move = function() {

    var globals = this.services.globals;
//jma    this.acceleration[0] = this.lastDirection * this.walkAcceleration;
    this.animTimer += globals.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    //this.updatePhysics(1);
	this.checkBall();
    this.updatePhysics();

    this.checkWall();
    this.checkLand()

    this.lastDirection = this.direction;
  };

  Ball.prototype.draw = function() {
    var globals = this.services.globals;
    var images = this.services.images;
    var spriteRenderer = this.services.spriteRenderer;
    var frameNumber = 0; //Math.floor(this.animTimer % this.anim.length); // jma
    var img = this.anim[frameNumber];

    var off = {};
    this.services.levelManager.getDrawOffset(off);

    var width  = 32;
    var height = 32;

    var sprite = this.sprite;
    sprite.uniforms.u_texture = img;
    sprite.x = off.x + ((              this.position[0]) | 0) * globals.scale;
    sprite.y = off.y + ((height / -2 + this.position[1]) | 0) * globals.scale;
    sprite.width  = width  * globals.scale;
    sprite.height = height * globals.scale;
    sprite.xScale = this.facing > 0 ? 1 : -1;

    var nameSprite = this.nameSprite;
    nameSprite.uniforms.u_texture = this.nameImage;
    nameSprite.x = off.x + ((              this.position[0])      | 0) * globals.scale;
    nameSprite.y = off.y + ((height / -2 + this.position[1] - 0) | 0) * globals.scale;
    nameSprite.width  = this.nameImage.img.width  * globals.scale;
    nameSprite.height = this.nameImage.img.height * globals.scale;
  };

  return Ball;
});

