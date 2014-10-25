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
    '../bower_components/hft-utils/dist/imageutils',
  ], function(
    Misc,
    Strings,
    ImageUtils
  ) {

  var numHuesPerAvatar = 50;

  /**
   * Manages the high score list.
   */

  function ScoreManager(services, topTodayElement, topHourElement, top10Mins) {
    this.services = services;
    this.services.entitySystem.addEntity(this);
    this.maxScores_ = 4;
    this.update = false;  // no players have been added
    this.busy = false;    // we're updating the display

    // premake all the different avatar colors (this is why we should probably
    // use WebGL to draw the avatars :(
    this.avatars = this.services.avatars.map(function(avatar) {
      var hues = [];
      var img = avatar.anims.idle.frames[0].img
      for (var ii = 0; ii < numHuesPerAvatar; ++ii) {
        var hue = ii / numHuesPerAvatar - 1;
        hues.push(ImageUtils.adjustHSV(img, hue, 0, 0, avatar.range));
      }
      return hues;
    });

    this.tops = [
      { element: topTodayElement,
        timeLimit: 60 * 60 * 24,
        lines: [],
        players: [],
      },
      { element: topHourElement,
        timeLimit: 60 * 60,
        lines: [],
        players: [],
      },
      { element: top10Mins,
        timeLimit: 60 * 10,
        lines: [],
        players: [],
      },
    ];

    // this.tops[0].timeLimit = 60;
    // this.tops[1].timeLimit = 20;
    // this.tops[2].timeLimit = 10;

    this.tops.forEach(function(top) {
      for (var ii = 0; ii < this.maxScores_; ++ii) {
        var line = this.createScoreLine();
        top.element.appendChild(line.line);
        top.lines.push(line);
        // add content
//        line.setName(ii & 1 ? "WW" : "ii");
//        line.setMsg(": " + Strings.padLeft(Math.pow(7,ii + 1), 7, "0"));
//        this.drawAvatar(line.ctx, {
//          avatarNdx: Misc.randInt(this.services.avatars.length),
//          hueNdx: Misc.randInt(numHuesPerAvatar),
//        });
      }
    }.bind(this));
  }

  ScoreManager.prototype.createScoreLine = function(player, color) {
    return this.createElement(player, color);
  };

  ScoreManager.prototype.drawAvatar = function(ctx, player) {
    var img = this.avatars[player.avatarNdx][player.hueNdx];
    var bigger = Math.max(img.width, img.height);
    var scale = ctx.canvas.width / bigger;
    var width  = img.width * scale;
    var height = img.height * scale;
    ctx.drawImage(
      img,
      (ctx.canvas.width  - width ) / 2,
      (ctx.canvas.height - height) / 2 ,
      width, height);
  };

  ScoreManager.prototype.advanceToNextTop = function() {
    this.tops[this.topNdx].update = false;
    this.state = 0;
    this.lineNdx = 0;
    this.topNdx++;
    if (this.topNdx == this.tops.length) {
      this.busy = false;
    }
  };

  ScoreManager.prototype.advanceToNextLine = function() {
    this.state = 0;
    this.lineNdx++;
    if (this.lineNdx == this.maxScores_) {
      this.advanceToNextTop();
    }
  };

  ScoreManager.prototype.doNextThing = function() {
    var top = this.tops[this.topNdx];
    var line = top.lines[this.lineNdx];
    var player = top.players[this.lineNdx];
    switch (this.state++) {
      case 0: //
        if (!top.update) {
          this.advanceToNextTop();
        } else if (line.player === player) {
          this.advanceToNextLine();
        }
        break;
      case 1: // erase score
        line.setMsg("");
        break;
      case 2: // erase name
        line.setName("");
        break;
      case 3: // draw erase avatar
      case 4: // draw erase avatar
      case 5: // draw erase avatar
      case 6: // draw erase avatar
        var ctx = line.ctx;
        var dur = 4;
        var lerp = (this.state - 3) / 4;
        var height = ctx.canvas.height * lerp;
        ctx.fillStyle = "red";
        ctx.fillRect(0, ctx.canvas.height / 2 - height / 2, ctx.canvas.width, height);
        break;
      case 7: // wait
        line.player = player;
        if (!player) {
          this.advanceToNextLine();
        }
        break;
      case 8: // wait
        break;
      case  9: // draw avatar
      case 10: // draw avatar
      case 11: // draw avatar
      case 12: // draw avatar
        var ctx = line.ctx;
        var dur = 4;
        var lerp = 1 - (this.state - 9) / 4;
        var height = ctx.canvas.height * lerp;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.drawAvatar(ctx, player);
        ctx.fillStyle = "red";
        ctx.fillRect(0, ctx.canvas.height / 2 - height / 2, ctx.canvas.width, height);
        break;
      case 13: // draw avatar
        var ctx = line.ctx;
        this.drawAvatar(ctx, player);
        break;
      case 14: // draw name
        line.setName(player.name);
        break;
      case 15: // draw score
        line.setMsg(player.score);
        break;
      case 16:
        this.advanceToNextLine();
        break;
    }
  };

  ScoreManager.prototype.process = function() {
    if (!this.update && !this.busy) {
      return;
    }

    if (this.busy) {
      this.doNextThing();
      return;
    }

    if (this.update) {
      this.busy = true;
      this.topNdx = 0;
      this.lineNdx = 0;
      this.state = 0;
      this.lineState = 0;
    }
  };

  ScoreManager.prototype.createElement = function() {
    var line = document.createElement("div");
    line.className = "scoreline";
    var span = document.createElement("div");
    span.className = "scorespan";
    var img = document.createElement("canvas");
    img.width = 32;
    img.height = 32;
    var ctx = img.getContext("2d");
    var info = document.createElement("div");
    info.className = "info";
    var name = document.createElement("span");
    var nameNode = document.createTextNode("");
    name.className = "name";
    var msg = document.createElement("span");
    var msgNode = document.createTextNode("");
    msg.className = "msg";
    msg.appendChild(msgNode);
    name.appendChild(nameNode);
    info.appendChild(name);
    info.appendChild(msg);
    line.appendChild(span);
    line.appendChild(img);
    line.appendChild(info);
    var element = {
      line: line,
      span: span,
      img: img,
      ctx: ctx,
      msg: msg,
      msgNode: msgNode,
      name: name,
      nameNode: nameNode,
      setName: function(s) {
        nameNode.nodeValue = s;
      },
      setMsg: function(s) {
        msgNode.nodeValue = s;
      },
    };
    if (!this.elementHeight_) {
      this.elementHeight_ = line.clientHeight;
    }
    return element;
  };

  ScoreManager.prototype.deleteElement = function(element) {
    if (element.line.parentNode) {
      element.line.parentNode.removeChild(element.line);
    }
  };

  // data:
  //   score: the score
  //   name: the name
  //   color: h,s,v
  //   avatarNdx: the avatar index
  //
  // // added after
  //   time: time it was added
  //   lineNdx: line this player is on?
  //
  // returns [dayPlace, hourPlace, 10MinPlace]


  ScoreManager.prototype.addPlayer = function(data) {
    var globals = this.services.globals;
    var newPlayer = {
      score: Strings.padLeft(data.score, 7, " "),
      name: data.name,
      hueNdx: (data.color.h * 50 | 0) % 50,  // we quantize this so we don't get too many? (or does it matter?)
      avatarNdx: data.avatarNdx,
      time: globals.gameTime,
    };

    // add it to each list and update each list
    this.update = true;
    var places = this.tops.map(function(top) {
      var players = top.players;

      // remove old ones.
      for (var ii = players.length - 1; ii >= 0; --ii) {
        var player = players[ii];
        var age = globals.gameTime - player.time;
        if (age > top.timeLimit) {
          players.splice(ii, 1);
        }
      }

      // insert it at the correct place.
      for (var ii = 0; ii < players.length; ++ii) {
        var player = players[ii];
        if (newPlayer.score >= player.score) {
          break;
        }
      }
      var place = ii;
      players.splice(ii, 0, newPlayer);

      top.update = true;

      return place;
    }.bind(this));

    // Don't do this ! If we do this then pretty much every player get's 5th for the day.
//    // Remove day players past max because otherwise they'll
//    // never be removed and we'll have thousands of players
//    var dayPlayers = this.tops[0].players;
//    if (dayPlayers.length > this.maxScores_) {
//      dayPlayers.splice(this.maxScores_, dayPlayers.length - this.maxScores_);
//    }

    return places
  };

  return ScoreManager;
});

