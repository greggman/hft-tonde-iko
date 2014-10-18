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

  var nameFontOptions = {
    font: "20px sans-serif",
    xOffset: 1,
    yOffset: 18,
    height: 20,
    padding: 3,
    fillStyle: "white",
  };

  var setCanvasFontStyles = function(ctx, options) {
    if (options.font        ) { ctx.font         = options.font;        }
    if (options.fillStyle   ) { ctx.fillStyle    = options.fillStyle;   }
    if (options.textAlign   ) { ctx.textAlign    = options.textAlign;   }
    if (options.testBaseline) { ctx.textBaseline = options.textBaselne; }
  };

  /**
   * Player represnt a player in the game.
   * @constructor
   */
  var Player = (function() {
    return function(services, width, height, direction, name, netPlayer, startPosition, data, isLocalPlayer) {
      var isNewPlayer = data === undefined;
      data = data || {};
      var globals = services.globals;
      this.services = services;
      this.renderer = services.renderer;
      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);
      this.netPlayer = netPlayer;
      this.velocity = [0, 0];
      this.acceleration = [0, 0];
      this.stopFriction = globals.stopFriction;
      this.walkAcceleration = globals.moveAcceleration;

      this.sprite = this.services.spriteManager.createSprite();
      this.nameSprite = this.services.spriteManager.createSprite();

      this.setAvatar(data.avatarNdx !== undefined ? data.avatarNdx : Misc.randInt(this.services.avatars.length));
      this.setColor(data.color || { h: Math.random(), s: 0, v: 0 });

      this.animTimer = 0;
      this.width = width;
      this.height = height;
      this.canJump = false;
      this.checkWallOffset = [
        -this.width / 2,
        this.width / 2 - 1,
      ];
      this.timeAccumulator = 0;
      this.moveVector = {};
      this.workVector = {};
      this.tileVector = {};

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('move', Player.prototype.handleMoveMsg.bind(this));
      netPlayer.addEventListener('jump', Player.prototype.handleJumpMsg.bind(this));
      netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));
      netPlayer.addEventListener('go', Player.prototype.handleGoMsg.bind(this));

      this.setName(name);
      this.direction = data.direction || 0;      // direction player is pushing (-1, 0, 1)
      this.facing = data.facing || direction;    // direction player is facing (-1, 1)
      this.score = 0;
      this.addPoints(0);

      this.reset(startPosition);
      if (data.velocity) {
        this.velocity[0] = data.velocity[0];
        this.velocity[1] = data.velocity[1];
        this.setState('move');
      } else if (isNewPlayer && !isLocalPlayer) {
        this.setState('waitForGo');
      } else {
        this.setState('idle');
      }

//this.setState('fall');
//this.position[0] = 393 + 10;
//this.position[1] = 466 - 10;
//this.lastPosition[0] = 402 + 11;
//this.lastPosition[1] = 466 - 10;
//this.velocity[0] = -200;
//this.velocity[1] =  370;

      this.checkBounds();
    };
  }());

  Player.prototype.setColor = function(color) {
    this.color = {
       h: color.h,
       s: color.s,
       v: color.v,
       hsv: [color.h, color.s, color.v, 0],
    };
    this.sprite.uniforms.u_hsvaAdjust = this.color.hsv.slice();
  };

  Player.prototype.setAvatar = function(avatarNdx) {
    this.avatarNdx = avatarNdx;
    this.avatar = this.services.avatars[avatarNdx];
    this.anims  = this.avatar.anims;
    this.idleAnimSpeed = (0.8 + Math.random() * 0.4) * this.avatar.idleAnimSpeed;
    this.sprite.uniforms.u_adjustRange = this.avatar.range.slice();
  };

  Player.prototype.setName = function(name) {
    if (name != this.playerName) {
      this.playerName = name;
      nameFontOptions.prepFn = function(ctx) {

        var h = (this.avatar.baseHSV[0] + this.color.h) % 1;
        var s = gmath.clamp(this.avatar.baseHSV[1] + this.color.s, 0, 1);
        var v = gmath.clamp(this.avatar.baseHSV[2] + this.color.v, 0, 1);
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

  Player.prototype.reset = function(startPosition) {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var position = startPosition || levelManager.getRandomOpenPosition();
    this.position = [position.x, position.y];
    this.lastPosition = [this.position[0], this.position[1]];
    this.setAvatar(this.avatarNdx);
  };

  Player.prototype.updateMoveVector = function() {
    this.moveVector.x = this.position[0] - this.lastPosition[0];
    this.moveVector.y = this.position[1] - this.lastPosition[1];
  };

  Player.prototype.checkCollisions = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    var xp = this.lastPosition[0];
    var yp = this.lastPosition[1];

    var tile = 0;
  };

  Player.prototype.addPoints = function(points) {
    this.score += points;
  };

  Player.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  Player.prototype.checkBounds = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    if (this.position[1] >= level.levelHeight) {
      debugger;
    }
  };

  Player.prototype.checkJump = function() {
    if (this.canJump) {
      if (this.jump) {
        this.canJump = false;
        this.setState('jump');
        return true;
      }
    } else {
      if (!this.jump) {
        this.canJump = true;
      }
    }
  };

//  Player.prototype.process = function() {
//    this.checkBounds();
//    this["state_" + this.state].call(this);
//  };

  Player.prototype.removeFromGame = function() {
    this.services.spriteManager.deleteSprite(this.sprite);
    this.services.spriteManager.deleteSprite(this.nameSprite);
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
    this.services.playerManager.removePlayer(this);
  };

  Player.prototype.handleDisconnect = function() {
    this.removeFromGame();
  };

  Player.prototype.handleBusyMsg = function(msg) {
    // We ignore this message
  };

  Player.prototype.handleMoveMsg = function(msg) {
    this.direction = msg.dir;
    if (this.direction) {
      this.facing = this.direction;
    }
  };

  Player.prototype.handleJumpMsg = function(msg) {
    this.jump = msg.jump;
    if (this.jump == 0) {
      this.jumpTimer = 0;
    }
  };

  Player.prototype.handleGoMsg = function(msg) {
    this.color = {
      h: msg.h,
      s: msg.s,
      v: msg.v,
    };

    this.setColor(msg.color);
    this.setAvatar(msg.avatar);
    this.setName(msg.name.replace(/[<>]/g, ''));

    this.position[0] = this.lastPosition[0];
    this.position[1] = this.lastPosition[1];
    this.setState("idle");
  };

  Player.prototype.sendCmd = function(cmd, data) {
    this.netPlayer.sendCmd(cmd, data);
  };

  Player.prototype.updatePosition = function(axis, elapsedTime) {
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

  Player.prototype.updateVelocity = function(axis, elapsedTime) {
    var globals = this.services.globals;
    var axis = axis || 3;
    if (axis & 1) {
      this.velocity[0] += this.acceleration[0] * elapsedTime;
      this.velocity[0] = Misc.clampPlusMinus(this.velocity[0], globals.maxVelocity[0]);
    }
    if (axis & 2) {
      this.velocity[1] += (this.acceleration[1] + globals.gravity) * elapsedTime;
      this.velocity[1] = Misc.clampPlusMinus(this.velocity[1], globals.maxVelocity[1]);
    }
  };

  Player.prototype.updatePhysics = function(axis) {
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

  Player.prototype.init_idle = function() {
    this.velocity[0] = 0;
    this.velocity[1] = 0;
    this.acceleration[0] = 0;
    this.acceleration[1] = 0;
    this.animTimer = 0;
    this.anim = this.anims.idle.frames;
  };

  Player.prototype.state_idle = function() {
    if (this.checkJump()) {
      return;
    } else if (this.direction) {
      this.setState('move');
      return;
    }
    var globals = this.services.globals;
    this.animTimer += globals.elapsedTime * this.idleAnimSpeed;
    this.checkFall();
  };

  Player.prototype.init_fall = function() {
    this.animTimer = 1;
    this.anim = this.anims.jump.frames;
  };

  Player.prototype.state_fall = function() {
    var globals = this.services.globals;
    this.acceleration[0] = this.direction * globals.moveAcceleration;
    this.updatePhysics();
    var landed = this.checkLand();
    this.checkWall();
    if (landed) {
      return;
    }
    if (Math.abs(this.velocity[1]) < globals.fallTopAnimVelocity) {
      this.animTimer = 2;
    } else if (this.velocity[1] >= globals.fallTopAnimVelocity) {
      this.animTimer = 3;
    }
  };

  Player.prototype.teleportToOtherGame = function(dir, dest, subDest) {
    // HACK!
    var globals = this.services.globals;
    var parts = /s(\d+)-(\d+)/.exec(globals.id);
    var id = parseInt(parts[1]) + parseInt(parts[2]) * globals.columns;
    var numScreens = globals.columns * globals.rows;
    id = gmath.emod(id + dir, numScreens);
    var id = "s" + (id % globals.columns) + "-" + (Math.floor(id / globals.columns));
    this.netPlayer.switchGame(id, {
      name: this.playerName,    // Send the name because otherwise we'll make a new one up
      avatarNdx: this.avatarNdx,// Send the avatarNdx so we get the same player
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

  Player.prototype.checkWall = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var off = this.velocity[0] < 0 ? 0 : 1;
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
          this.velocity[0] = 0;
          var distInTile = gmath.emod(xCheck, level.tileWidth);
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
          } else {
            var dir = (tile.dest == 0 || tile.dest == 2) ? -1 : 1;
            this.teleportToOtherGame(dir, tile.dest, tile.subDest);
          }
        }
      }
    }
  };

  Player.prototype.checkFall = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    var levelManager = this.services.levelManager;
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1]);
      if (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x8))) {
        this.stopFriction = tile.stopFriction || globals.stopFriction;
        this.walkAcceleration = tile.walkAcceleration || globals.moveAcceleration;
        if (tile.thing == "switch") {
          level.getThings("switch")[tile.id][0].doorSwitch.switchOn();
        }
        return false;
      }
    }
    this.setState('fall');
    return true;
  };

  Player.prototype.checkUp = function() {
    var levelManager = this.services.levelManager;
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1] - this.height);
      if (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x4))) {
        var level = levelManager.getLevel();
        this.velocity[1] = 0;
        this.position[1] = (gmath.unitdiv(this.position[1], level.tileHeight) + 1) * level.tileHeight;
        if (!this.bonked) {
          this.bonked = true;
          this.services.audioManager.playSound('bonkhead');
        }
        return true;
      }
    }
    return false;
  };

  Player.prototype.checkDown = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1]);
      if (tile.collisions && (!tile.sideBits || (tile.sideBits & 0x8))) {
        var ty = gmath.unitdiv(this.position[1], level.tileHeight) * level.tileHeight;
        if (!this.oneWay || this.lastPosition[1] <= ty) {
          this.position[1] = Math.floor(this.position[1] / level.tileHeight) * level.tileHeight;
          this.velocity[1] = 0;
          this.stopFriction = tile.stopFriction || globals.stopFriction;
          this.services.audioManager.playSound('land');
          this.setState('move');
        }
        return true;
      }
    }
    return false;
  };

  Player.prototype.checkLand = function() {
    if (this.velocity[1] > 0) {
      return this.checkDown();
    } else {
      return this.checkUp();
    }
  };

  Player.prototype.init_move = function() {
    this.animTimer = 0;
    this.anim = this.anims.move.frames;
    this.lastDirection = this.direction;
  };

  Player.prototype.state_move = function() {
    if (this.checkJump()) {
      return;
    }

    var globals = this.services.globals;
    this.acceleration[0] = this.lastDirection * this.walkAcceleration;
    this.animTimer += this.avatar.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    this.updatePhysics(1);

    this.checkWall();
    this.checkFall();

    if (!this.direction) {
      this.setState('stop');
      return;
    }

    this.lastDirection = this.direction;
  };

  Player.prototype.init_stop = function() {
    this.lastDirection = this.direction;
    this.acceleration[0] = 0;
  };

  Player.prototype.state_stop = function() {
    if (this.checkJump()) {
      return;
    }

    if (this.direction) {
      this.setState('move');
      return;
    }

    var globals = this.services.globals;
    this.velocity[0] *= this.stopFriction;
    if (Math.abs(this.velocity[0]) < globals.minStopVelocity) {
      this.setState('idle');
      return;
    }

    this.animTimer += this.avatar.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    this.updatePhysics(1);
    this.checkWall();
    this.checkFall();
  };

  Player.prototype.init_jump = function() {
    var globals = this.services.globals;
    this.jumpTimer = 0;
    this.animTimer = 0;
    this.bonked = false;
    this.anim = this.anims.jump.frames;
    this.services.audioManager.playSound('jump');
  };

  Player.prototype.state_jump = function() {
    var globals = this.services.globals;
    this.acceleration[0] = this.direction * globals.moveAcceleration;
    this.velocity[1] = globals.jumpVelocity;
    this.jumpTimer += globals.elapsedTime;
    this.updatePhysics();
    this.checkLand();
    this.checkWall();
    if (this.jumpTimer >= globals.jumpFirstFrameTime) {
      this.animTimer = 1;
    }
    if (this.jumpTimer >= globals.jumpDuration || !this.jump) {
      this.setState('fall');
    }
  };

  Player.prototype.init_waitForGo = function() {
    this.lastPosition[0] = this.position[0];
    this.lastPosition[1] = this.position[1];
    this.anim = this.anims.idle.frames;

    // move us off the screen so no collisions happen
    this.position[0] = -1000;
    this.position[1] = -1000;
  };

  Player.prototype.state_waitForGo = function() {
    // Do nada.
  };

  Player.prototype.draw = function() {
    var globals = this.services.globals;
    var images = this.services.images;
    var spriteRenderer = this.services.spriteRenderer;
    var frameNumber = Math.floor(this.animTimer % this.anim.length);
    var img = this.anim[frameNumber];

    var off = {};
    this.services.levelManager.getDrawOffset(off);

    var width  = img.img.width  * this.avatar.scale; //32;
    var height = img.img.height * this.avatar.scale; //32;

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
    nameSprite.y = off.y + ((height / -2 + this.position[1] - 36) | 0) * globals.scale;
    nameSprite.width  = this.nameImage.img.width  * globals.scale;
    nameSprite.height = this.nameImage.img.height * globals.scale;
  };

  return Player;
});

