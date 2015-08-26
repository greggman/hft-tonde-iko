飛んで行こ！(Tonde-Iko!)
======================

This is a 50 player 6 screen platformer. Players
connect to the WiFi and use their smartphone to
control a player. They then start at the left
most screen and can move their characters
across all 6 screens.

[![Video of Tonde-Iko at Steam Carnival](images/play-video-cover.jpg)](http://www.youtube.com/watch?v=aFMNmKYE8KM)<br/>

<img src="images/all-set-up.jpg" width="750" height="160" />

Made with [HappyFunTimes](http://greggman.github.io/HappyFunTimes)

The 6 levels below were created for the [Steam Carnival](http://steamcarnival.com)

<img src="images/level0-0.jpg" width="640" height="357" />

<img src="images/level1-0.jpg" width="640" height="357" />

<img src="images/level2-0.jpg" width="640" height="357" />

<img src="images/level3-0.jpg" width="640" height="357" />

<img src="images/level4-0.jpg" width="640" height="357" />

<img src="images/level5-0.jpg" width="640" height="357" />


Making Levels
-------

See [Making Levels](making.md).

Note: The code is currently hardcoded to 6 levels across. That is an artifical limit. It would be trival (as in minutes of work) to support
any number of screens in any arrangement. Instead of

    ▆ ▆ ▆ ▆ ▆ ▆

How about

                ▆ ▆ ▆   ▆ ▆ ▆
        ▆ ▆ ▆   ▆   ▆ ▆ ▆   ▆ ▆ ▆
    ▆ ▆ ▆   ▆ ▆ ▆       ▆ ▆ ▆

With a little more work diagonal screens could also be supported.

Running
-------

If you want to run it requires 7 machines and 6 monitors, 1 network switch, 1 wifi router.

1.  Connect all 7 machines and the router to the network switch.
2.  On one machine, [install happyfuntimes](http://docs.happyfuntimes.com/install.html).
3.  clone this repo (or download the zip).
4.  Install [node.js](http://nodejs.org/download).
5.  Open a terminal/command prompt
6.  Install bower by typing `sudo npm -g install bower` (if on windows don't type `sudo`)

    bower is a *package* manager for downloading libraries needed by project

7.  cd to the place you unzipped or cloned this project and type `bower install`

    this installs the extra libraries needed by tonde-iko

8.  type `hft add`

    this adds tonde-iko to your local happyfuntimes installation

    You can now run the individual levels by running happyfuntimes and picking the hft-tonde-iko game.

    Run one level, copy the URL. You'll need it for the steps below

9.  Setup the router for [installation mode](http://docs.happyfuntimes.net/docs/network.html).
10. Install Chrome on the other 6 machines.
11. On each of those machines write a script to launch chrome when the machine starts

    on Mac that is something like

        /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --no-first-run "<URL>"

    Where `<URL>` is the URL copied from step 8 except change `localhost` to the ip address of the machine
    running happyfuntimes. You know this ip address from setting up installation mode (step 9)

    Example URL

        http://192.168.2.9:8080/games/(_Users_gregg_src_hft-tonde-iko)tonde-iko/realgame.html?settings={%22shared%22:{%22canvasWidth%22:1280,%22canvasHeight%22:720,%22fullWidth%22:7680,%22fullHeight%22:720},%22x%22:2560,%22y%22:0,%22columns%22:6,%22rows%22:1,%22id%22:%22s2-0%22,%22levelName%22:%22level2-0%22}

    Note at the end of the URL

        %22id%22:%22s2-0%22,%22levelName%22:%22level2-0%22
                     ^                              ^
                     |                              |
              id ----+                level name ---+

    The ids and level names are

        s0-0  level0-0
        s1-0  level1-0
        s2-0  level2-0
        s3-0  level3-0
        s4-0  level4-0
        s5-0  level5-0

    The --kiosk makes chrome run fullscreen. The --no-first-run tells it no to ask you to set it up

    I realized I'm glossing over how to write a startup script here. Google that as it changes by OS.

That should be it. If you start the happyfuntimes then reboot the other 6 machines they should each launch chrome and go to their specific levels


Cloning
-------

[If you want to clone this follow the instructions here](https://github.com/greggman/HappyFunTimes/blob/master/docs/makinggames.md)

Attribution
-----------

See [Attribution](attribution.md)

