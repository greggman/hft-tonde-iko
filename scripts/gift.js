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
    './canvas-utils',
    './math',
  ], function(
    Misc,
    Strings,
    M2D,
    ImageUtils,
    CanvasUtils,
    gmath) {

  var nextColor = 0;
  var nameFontOptions = {
    font: "20px sans-serif",
    xOffset: 1,
    yOffset: 18,
    height: 20,
    padding: 3,
    fillStyle: "white",
  };

  /**
   * Gift represnt a gift that flys out of avatar when he burst out of the cake at the end.
   * @constructor
   */
  var Gift = (function() {
    return function(services, player) {
      var globals = services.globals;
      this.services = services;
      var levelManager = this.services.levelManager;
      var level = levelManager.getLevel();
      
      this.renderer = services.renderer;
      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);
      this.velocity = [0,0];
      this.velocity[0] =  -(player.velocity[0]);
      this.velocity[1] =  player.velocity[1];
      this.acceleration = [0, 0];
      this.stopFriction = globals.stopFriction;
      this.giftElasticity = 0.2;
      this.giftStopVelocity = globals.giftStopVelocity;
      this.walkAcceleration = globals.moveAcceleration;
      this.idleAnimSpeed = (0.8 + Math.random() * 0.4) * globals.idleAnimSpeed;
      this.giftScale = player.giftScale; 
       
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
      this.width  = 32;
      this.height = 32;

      var img = player.anim[0];
      var height = img.img.height * player.avatar.scale;
      var startPosition = {
        x: player.position[0] ,
        y: player.position[1] + -64
      };

       
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


      this.avatar = player.avatar;
      this.color = player.color;
      this.setName(player.playerName + "+500");
      player.addPoints(500);
      this.facing = 1;     // direction player is facing (-1, 1)
      this.score = 0;

      //console.log(startPosition);
      this.reset(startPosition);
      this.setState('move');


      this.checkBounds();
    };
  }());

  Gift.prototype.setName = function(name) {
    if (name != this.playerName) {
      this.playerName = name;
      nameFontOptions.prepFn = function(ctx) {

        var h = (this.avatar.baseHSV[0] + this.color.h) % 1;
        var s = gmath.clamp(this.avatar.baseHSV[1] + this.color.s, 0, 1);
        var v = gmath.clamp(this.avatar.baseHSV[2] + this.color.v, 0, 1);
        var brightness = (0.2126 * this.avatar.baseColor[0] / 255 + 0.7152 * this.avatar.baseColor[1] / 255 + 0.0722 * this.avatar.baseColor[2] / 255);
        nameFontOptions.fillStyle = brightness > 0.6 ? "black" : "white";
        var rgb = ImageUtils.hsvToRgb(h, s, v);
        ctx.beginPath();
        CanvasUtils.roundedRect(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, 10);
        ctx.fillStyle = "rgb(" + rgb.join(",") + ")";
        ctx.fill();
      }.bind(this);

      this.nameImage = this.services.createTexture(
          ImageUtils.makeTextImage(name, nameFontOptions));
    }
  };

  Gift.prototype.reset = function(startPosition) {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    //console.log (levelManager.getRandomOpenPosition());
    var position = startPosition || levelManager.getRandomOpenPosition();
    this.position = [position.x, position.y];
    this.lastPosition = [this.position[0], this.position[1]];
    this.sprite.uniforms.u_hsvaAdjust = this.color.hsv.slice();
    //this.sprite.uniforms.u_adjustRange = this.color.range.slice();
  };

  Gift.prototype.updateMoveVector = function() {
    this.moveVector.x = this.position[0] - this.lastPosition[0];
    this.moveVector.y = this.position[1] - this.lastPosition[1];
  };

  Gift.prototype.setState = function(state) {
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

  Gift.prototype.checkBounds = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    if (this.position[1] >= level.levelHeight) {
      debugger;
    }
  };

  Gift.prototype.removeFromGame = function() {
    this.services.spriteManager.deleteSprite(this.sprite);
    this.services.spriteManager.deleteSprite(this.nameSprite);
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
  };

  Gift.prototype.updatePosition = function(axis, elapsedTime) {
    var axis = axis || 3;
    if (axis & 1) {
      this.position[0] += this.velocity[0] * elapsedTime;
    }
    if (axis & 3) {
      this.position[1] += this.velocity[1] * elapsedTime;
    }
  };

  Gift.prototype.updateVelocity = function(axis, elapsedTime) {
    var globals = this.services.globals;
    var axis = axis || 3;
    if (axis & 1) {
//      this.velocity[0] += this.acceleration[0] * elapsedTime;
      this.velocity[0] = Misc.clampPlusMinus(this.velocity[0], globals.maxVelocityGift[0]);
    }
    if (axis & 2) {
      this.velocity[1] += (this.acceleration[1] + globals.giftGravity) * elapsedTime;
      this.velocity[1] = Misc.clampPlusMinus(this.velocity[1], globals.maxVelocityGift[1]);
    }
  };

  Gift.prototype.updatePhysics = function(axis) {
    var kOneTick = 1 / 60;
    var globals = this.services.globals;
    this.timeAccumulator += globals.elapsedTime;
    var ticks = (this.timeAccumulator / kOneTick) | 0;
    this.timeAccumulator -= ticks * kOneTick;
    this.lastPosition[0] = this.position[0];
    this.lastPosition[1] = this.position[1];
    for (var ii = 0; ii < ticks; ++ii) {
      this.updateVelocity(axis, kOneTick);
      this.updatePosition(axis, kOneTick);
    }
  };

  Gift.prototype.checkWall = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var off = this.velocity[0] < 0 ? 0 : 1;
    var didBounce = false;
    for (var ii = 0; ii < 2; ++ii) {
      var xCheck = this.position[0] + this.checkWallOffset[off];
        var tile = levelManager.getTileInfoByPixel(xCheck, this.position[1] - this.height / 4 - this.height / 2 * ii);
        if (tile.solidForAI && tile.collisions && (!tile.sideBits || (tile.sideBits & 0x3))) {
          if (!didBounce) {
            this.velocity[0] = -this.velocity[0] * this.giftElasticity; //0; jma
            if (Math.abs(this.velocity[0]) < this.giftStopVelocity) {
              this.velocity[0] = 0;
            }
            didBounce = true;
          }
          var distInTile = gmath.emod(xCheck, level.tileWidth);
          var xoff = off ? -distInTile : level.tileWidth - distInTile;
          this.position[0] += xoff;
        }
    }
  };


  Gift.prototype.checkUp = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1] - this.height);
      if (tile.solidForAI && tile.collisions && (!tile.sideBits || (tile.sideBits & 0x4))) {
        this.velocity[1] = -this.velocity[1] * this.giftElasticity; // 0;
        if (Math.abs(this.velocity[1]) < this.giftStopVelocity) {
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

  Gift.prototype.checkDown = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1]);
      if (tile.solidForAI) {
        var ty = gmath.unitdiv(this.position[1], level.tileHeight) * level.tileHeight;
        if (!this.oneWay || this.lastPosition[1] <= ty) {
          this.position[1] = Math.floor(this.position[1] / level.tileHeight) * level.tileHeight;
          this.velocity[1] = -Math.abs(this.velocity[1]) * this.giftElasticity; //0;
          if (Math.abs(this.velocity[1]) < this.giftStopVelocity) {
            this.velocity[1] = 0;
          }
          this.stopFriction = tile.stopFriction || globals.stopFriction;
          this.velocity[0] *= this.stopFriction;
          if (!this.landed) {
            this.landed = true;
            //this.services.audioManager.playSound('land');
	        this.addConfettiNearGift(1000 * 0);
	        this.addConfettiNearGift(1000 * 0.5);
	        this.addConfettiNearGift(1000 * 1.0);
          }
        }
        return true;
      }
     }
    return false;
  };

  Gift.prototype.addConfettiNearGift = function(delay) {
    var x = this.position[0];// + Misc.randInt(150);
    var y = this.position[1] - this.height/2; // + Misc.randInt(100);
    var pm = this.services.particleEffectManager;
    setTimeout(function() {
      pm.spawnConfetti(x, y);
    }, delay);
  };
  
  Gift.prototype.checkLand = function() {
    if (this.velocity[1] > 0) {
      this.bonked = false;
      return this.checkDown();
    } else if (this.velocity[1] < 0){
      this.landed = false;
      return this.checkUp();
    }
  };

  Gift.prototype.init_move = function() {
    this.animTimer = 0;
    this.anim = this.services.images.gift.frames;
    this.bonked = false;
    this.landed = false;

  };

  Gift.prototype.state_move = function() {

    var globals = this.services.globals;
    this.animTimer += globals.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    //this.updatePhysics(1);
    this.updatePhysics();

    this.checkLand()
    this.checkWall();

  };

  Gift.prototype.draw = function() {
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
    sprite.y = off.y + ((height*this.giftScale / -2 + this.position[1]) | 0) * globals.scale;
    sprite.width  = width  * globals.scale;
    sprite.height = height * globals.scale;
    sprite.xScale = this.giftScale;
    sprite.yScale = this.giftScale;

    var nameSprite = this.nameSprite;
    nameSprite.uniforms.u_texture = this.nameImage;
    nameSprite.x = off.x + ((              this.position[0])      | 0) * globals.scale;
    nameSprite.y = off.y + ((height / -2 + this.position[1] - 36 * this.giftScale) | 0) * globals.scale;
    nameSprite.width  = this.nameImage.img.width  * globals.scale;
    nameSprite.height = this.nameImage.img.height * globals.scale;
  };

  return Gift;
});

